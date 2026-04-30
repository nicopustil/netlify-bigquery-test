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

  // Parse body first
  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { query: queryType, startDate, endDate } = parsedBody;
  if (!queryType) {
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
    const dataset = 'ga4_leadership_victoria_us';
    const propId = '317130094';

    const dateFilter = startDate && endDate
      ? `AND report_date BETWEEN '${startDate}' AND '${endDate}'`
      : `AND report_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 120 DAY)`;

    let sql = '';

    if (queryType === 'traffic') {
      sql = `
        SELECT sessionDefaultChannelGroup as channel, SUM(sessions) as sessions, SUM(totalUsers) as users
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_TrafficAcquisition_${propId}*\`
        WHERE TRUE ${dateFilter}
        GROUP BY channel ORDER BY sessions DESC
      `;
    } else if (queryType === 'revenue') {
      sql = `
        SELECT sessionDefaultChannelGroup as channel, SUM(transactions) as purchases, SUM(transactionRevenue) as revenue
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_EcommercePurchases_${propId}*\`
        WHERE TRUE ${dateFilter}
        GROUP BY channel ORDER BY revenue DESC
      `;
    } else if (queryType === 'events') {
      sql = `
        SELECT eventName as event, sessionDefaultChannelGroup as channel, SUM(eventCount) as count, SUM(totalRevenue) as revenue
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_Events_${propId}*\`
        WHERE TRUE ${dateFilter}
        GROUP BY event, channel ORDER BY count DESC LIMIT 100
      `;
    } else if (queryType === 'pages') {
      sql = `
        SELECT landingPage as page, sessionDefaultChannelGroup as channel, SUM(sessions) as sessions, AVG(bounceRate) as bounceRate, AVG(averageSessionDuration) as avgDuration
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_LandingPage_${propId}*\`
        WHERE TRUE ${dateFilter}
        GROUP BY page, channel ORDER BY sessions DESC LIMIT 50
      `;
    } else if (queryType === 'engagement') {
      sql = `
        SELECT sessionDefaultChannelGroup as channel, SUM(sessions) as sessions, AVG(bounceRate) as bounceRate, AVG(averageSessionDuration) as avgDuration, AVG(screenPageViewsPerSession) as pagesPerSession, SUM(engagedSessions) as engagedSessions
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_TrafficAcquisition_${propId}*\`
        WHERE TRUE ${dateFilter}
        GROUP BY channel ORDER BY sessions DESC
      `;
    } else if (queryType === 'kpis') {
      sql = `
        SELECT
          SUM(t.sessions) as totalSessions, SUM(t.totalUsers) as totalUsers,
          AVG(t.bounceRate) as avgBounceRate, AVG(t.averageSessionDuration) as avgDuration,
          (SELECT SUM(transactions) FROM \`leadership-victoria-494806.${dataset}.p_ga4_EcommercePurchases_${propId}*\` WHERE TRUE ${dateFilter}) as totalPurchases,
          (SELECT SUM(transactionRevenue) FROM \`leadership-victoria-494806.${dataset}.p_ga4_EcommercePurchases_${propId}*\` WHERE TRUE ${dateFilter}) as totalRevenue
        FROM \`leadership-victoria-494806.${dataset}.p_ga4_TrafficAcquisition_${propId}*\` t
        WHERE TRUE ${dateFilter}
      `;
    } else if (queryType === 'test') {
      sql = `SELECT 1 as test`;
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown query type: ' + queryType }) };
    }

    const [rows] = await bq.query({ query: sql, location: 'US' });
    return { statusCode: 200, headers, body: JSON.stringify({ data: rows }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, type: err.constructor.name }) };
  }
};
