import fs from 'fs';
import path from 'path';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const candidates = [
      path.resolve(__dirname, 'data/website-data.json'),
      path.resolve(__dirname, './data/website-data.json'),
      path.resolve(process.cwd(), 'netlify/functions/data/website-data.json'),
      path.resolve(process.cwd(), 'storefront/netlify/functions/data/website-data.json')
    ];

    let content = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        content = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!content) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'website-data.json not found in netlify/functions/data/. Please build the project manually to fetch from MongoDB.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: content
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};

