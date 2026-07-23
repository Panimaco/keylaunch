-- Allow creators to revoke keys
CREATE POLICY keys_update ON access_keys FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- Allow creators to insert versions metadata is handled via edge functions only;
-- versions are inserted by service role in complete-upload
