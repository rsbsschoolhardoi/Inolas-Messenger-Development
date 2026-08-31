import { app } from '../server';

export default function handler(req: any, res: any) {
  // Universal CORS preflight & headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle dynamic path on Vercel
  if (req.url) {
    if (!req.url.startsWith('/api') && (req.url.startsWith('/v1') || req.url.startsWith('/health'))) {
      req.url = '/api' + req.url;
    }
  }

  return app(req, res);
}
