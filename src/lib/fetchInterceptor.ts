const originalFetch = window.fetch;

// Proactively run cookie check on module load
if (typeof window !== 'undefined') {
  originalFetch('/__cookie_check.html', { credentials: 'include' }).catch(() => {});
}

window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  let [resource, config] = args;
  config = {
    credentials: 'include',
    ...config,
  };

  try {
    let response = await originalFetch(resource, config);
    
    // Check if response is the AI Studio cookie check page or redirect HTML
    const cloned = response.clone();
    const text = await cloned.text().catch(() => '');
    
    if (
      response.url.includes('__cookie_check') || 
      text.includes('__cookie_check') || 
      (text.includes('<!DOCTYPE html>') && (text.includes('302 Found') || text.includes('Cookie Check')))
    ) {
      // Automatically perform cookie check handshake
      try {
        await originalFetch('/__cookie_check.html', { credentials: 'include' });
        await new Promise(r => setTimeout(r, 300));
        response = await originalFetch(resource, config);
      } catch (e) {
        console.warn('Cookie check handshake failed:', e);
      }
    }
    
    return response;
  } catch (err) {
    throw err;
  }
};
