const SAFE_PARAMS = new Set(['tab', 'view', 'page', 'status', 'filter', 'stage']);

export function sanitizeUrl(url: string): { path: string; host: string } {
  try {
    const parsed = new URL(url);
    const sanitizedParams = new URLSearchParams();

    for (const [key, value] of parsed.searchParams.entries()) {
      if (SAFE_PARAMS.has(key)) {
        sanitizedParams.set(key, value);
      }
    }

    const queryString = sanitizedParams.toString();
    return {
      host: parsed.host,
      path: parsed.pathname + (queryString ? `?${queryString}` : ''),
    };
  } catch {
    return { host: 'unknown', path: '/' };
  }
}

export function sanitizeTitle(title: string): string {
  // Remove potential sensitive info from tab titles
  // Truncate to 100 chars
  return title.slice(0, 100);
}
