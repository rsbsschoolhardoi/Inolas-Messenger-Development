const originalFetch = window.fetch;

if (typeof window !== 'undefined') {
  originalFetch('/__cookie_check.html', { credentials: 'include' }).catch(() => {});
}

export async function apiFetch(resource: RequestInfo | URL, config?: RequestInit): Promise<Response> {
  const mergedConfig: RequestInit = {
    credentials: 'include',
    ...config,
  };

  try {
    let response = await originalFetch(resource, mergedConfig);
    
    const cloned = response.clone();
    const text = await cloned.text().catch(() => '');
    
    if (
      response.status === 405 ||
      response.url.includes('__cookie_check') || 
      text.includes('__cookie_check') || 
      (text.includes('<!DOCTYPE html>') && (text.includes('302 Found') || text.includes('Cookie Check')))
    ) {
      try {
        await originalFetch('/__cookie_check.html', { credentials: 'include' });
        await new Promise(r => setTimeout(r, 300));
        response = await originalFetch(resource, mergedConfig);
      } catch (e) {
        console.warn('Cookie check handshake failed:', e);
      }
    }
    
    return response;
  } catch (err) {
    throw err;
  }
}
