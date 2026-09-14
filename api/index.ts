import { app } from '../server.js';

export default function handler(req: any, res: any) {
  // Universal CORS preflight & headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key, X-Client-Id, X-Client-Secret, X-SA-Client-Id, X-SA-Client-Secret, *'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle Vercel URL mapping & rewrite paths
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-original-url'] || req.headers['x-matched-path'];
  if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri !== '/api/index') {
    req.url = forwardedUri;
  }

  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/v1')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
