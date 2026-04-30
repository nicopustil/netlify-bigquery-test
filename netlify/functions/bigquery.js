const { BigQuery } = require('@google-cloud/bigquery');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { query } = parsedBody;
  if (!query) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Required parameter is missing: query' }) };
  }

  try {
    const rawCreds = process.env.GOOGLE_CREDENTIALS;
    if (!rawCreds) throw new Error('GOOGLE_CREDENTIALS not set');

    let credentials;
    try {
      credentials = JSON.parse(rawCreds);
    } catch(e) {
      const decoded = Buffer.from(rawCreds, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
    }

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const bq = new BigQuery({ credentials, projectId: 'leadership-victoria-494806' });
    const [rows] = await bq.query({ query, location: 'US' });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, rows }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, type: err.constructor.name }) };
  }
};
