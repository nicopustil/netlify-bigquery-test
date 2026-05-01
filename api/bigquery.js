const { BigQuery } = require('@google-cloud/bigquery');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const rawCreds = process.env.GOOGLE_CREDENTIALS;
    if (!rawCreds) throw new Error('GOOGLE_CREDENTIALS not set');

    let credentials;
    try {
      credentials = JSON.parse(rawCreds);
    } catch {
      credentials = JSON.parse(Buffer.from(rawCreds, 'base64').toString('utf8'));
    }
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const bq = new BigQuery({ credentials, projectId: 'leadership-victoria-494806' });
    const [rows] = await bq.query({ query, location: 'US' });
    return res.status(200).json({ ok: true, rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
