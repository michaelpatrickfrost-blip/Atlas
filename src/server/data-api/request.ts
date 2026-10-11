const forbiddenOrigin = () => new Error('FORBIDDEN: unexpected origin.');

function incomingOrigin(request: Request): string {
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw forbiddenOrigin();
  const host = request.headers.get('host');
  if (host === null) return url.origin;

  // Host is a single authority, never a URL, forwarded host list or userinfo.
  const authority = /^(\[[0-9a-fA-F:]+\]|[a-zA-Z0-9.-]+)(?::([0-9]{1,5}))?$/.exec(host);
  if (!authority) throw forbiddenOrigin();
  const parsed = new URL(`${url.protocol}//${host}`);
  if (parsed.hostname !== authority[1].toLowerCase()) throw forbiddenOrigin();
  const port = authority[2];
  if (port !== undefined && (String(Number(port)) !== port || Number(port) > 65535)) {
    throw forbiddenOrigin();
  }
  return parsed.origin;
}

export function assertDesktopRequest(request: Request): void {
  if (request.headers.get('x-atlas-client') !== 'desktop') {
    throw new Error('FORBIDDEN: use the Atlas data client.');
  }
  const origin = request.headers.get('origin');
  // Native clients have no browser Origin; keep their existing policy.
  if (origin === null) return;
  try {
    // Canonical browser origins cannot contain paths, credentials or URL suffixes.
    if (new URL(origin).origin !== origin || origin !== incomingOrigin(request)) {
      throw forbiddenOrigin();
    }
  } catch {
    throw forbiddenOrigin();
  }
}
