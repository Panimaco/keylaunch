-- KeyLaunch schema

-- Enums
CREATE TYPE scan_status AS ENUM ('pending_scan', 'scanning', 'clean', 'infected', 'rejected');
CREATE TYPE key_status AS ENUM ('available', 'used', 'revoked');
CREATE TYPE activation_status AS ENUM ('active', 'revoked');
CREATE TYPE scan_job_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  icon_url TEXT,
  executable_path TEXT NOT NULL DEFAULT '',
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  changelog TEXT,
  storage_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  selectable BOOLEAN NOT NULL DEFAULT FALSE,
  is_latest BOOLEAN NOT NULL DEFAULT FALSE,
  scan_status scan_status NOT NULL DEFAULT 'pending_scan',
  vt_report_url TEXT,
  vt_positives INT DEFAULT 0,
  vt_total INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

CREATE TABLE access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  code_prefix TEXT NOT NULL,
  status key_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL UNIQUE REFERENCES access_keys(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  installed_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  status activation_status NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  last_comment_at TIMESTAMPTZ
);

CREATE TABLE scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  status scan_job_status NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_versions_project ON versions(project_id);
CREATE INDEX idx_keys_project ON access_keys(project_id);
CREATE INDEX idx_keys_status ON access_keys(project_id, status);
CREATE INDEX idx_activations_project ON activations(project_id);
CREATE INDEX idx_activations_status ON activations(project_id, status);
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status, created_at);
CREATE INDEX idx_comments_project ON comments(project_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: creators full access to own
CREATE POLICY projects_select ON projects FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY projects_update ON projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY projects_delete ON projects FOR DELETE USING (auth.uid() = creator_id);

-- Versions: creators manage own project versions
CREATE POLICY versions_select ON versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);
CREATE POLICY versions_update ON versions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- Keys: creators see own
CREATE POLICY keys_select ON access_keys FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- Activations: creators see own project activations
CREATE POLICY activations_select ON activations FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- Comments: creators read own project comments
CREATE POLICY comments_select ON comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- Scan jobs: creators read own
CREATE POLICY scan_jobs_select ON scan_jobs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM versions v
    JOIN projects p ON p.id = v.project_id
    WHERE v.id = version_id AND p.creator_id = auth.uid()
  )
);

-- Helper: count active activations
CREATE OR REPLACE FUNCTION count_active_activations(p_project_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM activations
  WHERE project_id = p_project_id AND status = 'active';
$$ LANGUAGE sql STABLE;

-- Helper: count creator projects
CREATE OR REPLACE FUNCTION count_creator_projects(p_creator_id UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM projects WHERE creator_id = p_creator_id;
$$ LANGUAGE sql STABLE;
