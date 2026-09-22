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
  res.setHeader('Access-Control-Expose-Headers', 'Link, WWW-Authenticate, Content-Type, Vary, x-markdown-tokens');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle Vercel URL mapping & rewrite paths
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-original-url'] || req.headers['x-matched-path'];
  if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri !== '/api/index') {
    req.url = forwardedUri;
  }

  const acceptHeader = String(req.headers['accept'] || '').toLowerCase();
  const formatQuery = String(req.query?.format || req.query?.markdown || '').toLowerCase();
  const isMarkdownReq = acceptHeader.includes('text/markdown') || 
                        acceptHeader.includes('text/x-markdown') || 
                        formatQuery === 'markdown' ||
                        formatQuery === 'true' ||
                        formatQuery === 'md';

  const isExcludedFromApiPrefix = isMarkdownReq || 
                                  req.url === '/' || 
                                  req.url === '' || 
                                  req.url.startsWith('/docs') || 
                                  req.url.startsWith('/.well-known');

  if (!isExcludedFromApiPrefix && req.url && !req.url.startsWith('/api') && !req.url.startsWith('/v1')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = () => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    };

    res.on('finish', safeResolve);
    res.on('close', safeResolve);

    try {
      app(req, res, (err: any) => {
        if (err) {
          console.error("Express App Handler Error:", err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Server Error: ' + (err?.message || String(err)) });
          }
        } else if (!res.headersSent) {
          res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
        }
        safeResolve();
      });
    } catch (topErr: any) {
      console.error("Vercel Serverless Function Top-Level Error:", topErr);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Server Function Error: ' + (topErr?.message || String(topErr)) });
      }
      safeResolve();
    }
  });
}
