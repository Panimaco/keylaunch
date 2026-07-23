interface VTAnalysisStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  total: number;
}

interface VTFileReport {
  data: {
    id: string;
    links?: { self: string };
    attributes: {
      last_analysis_stats: VTAnalysisStats;
      link?: string;
    };
  };
}

export async function scanHash(sha256: string): Promise<{
  positives: number;
  total: number;
  reportUrl: string | null;
  status: 'clean' | 'infected' | 'unknown';
}> {
  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY')!;
  const threshold = parseInt(Deno.env.get('VT_DETECTION_THRESHOLD') || '2', 10);

  const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
    headers: { 'x-apikey': apiKey },
  });

  if (res.status === 404) {
    return { positives: 0, total: 0, reportUrl: null, status: 'unknown' };
  }

  if (!res.ok) {
    throw new Error(`VirusTotal API error: ${res.status}`);
  }

  const report: VTFileReport = await res.json();
  const stats = report.data.attributes.last_analysis_stats;
  const positives = stats.malicious + stats.suspicious;
  const total = stats.total;
  const reportUrl = report.data.links?.self || `https://www.virustotal.com/gui/file/${sha256}`;

  return {
    positives,
    total,
    reportUrl,
    status: positives >= threshold ? 'infected' : 'clean',
  };
}

export async function submitFileForScan(fileBuffer: ArrayBuffer): Promise<string> {
  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY')!;
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), 'build.zip');

  const res = await fetch('https://www.virustotal.com/api/v3/files', {
    method: 'POST',
    headers: { 'x-apikey': apiKey },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`VirusTotal upload error: ${res.status}`);
  }

  const data = await res.json();
  return data.data.id as string;
}

export async function pollAnalysis(analysisId: string): Promise<string | null> {
  const apiKey = Deno.env.get('VIRUSTOTAL_API_KEY')!;
  const res = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    headers: { 'x-apikey': apiKey },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.data.attributes.status === 'completed') {
    return data.data.meta.file_info?.sha256 ?? null;
  }
  return null;
}
