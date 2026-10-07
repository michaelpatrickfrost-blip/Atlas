/** Navigation may retain a selected record while changing a query-based view. */
export function moduleNavHref(href: string, current: URLSearchParams, preserve: string[] = []) {
  const url = new URL(href, 'https://atlas.invalid');
  for (const key of preserve) {
    const value = current.get(key);
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.pathname + url.search + url.hash;
}

export function moduleNavActive(href: string, pathname: string, current: URLSearchParams) {
  const url = new URL(href, 'https://atlas.invalid');
  return (pathname === url.pathname || pathname.startsWith(url.pathname + '/')) &&
    [...url.searchParams].every(([key, value]) => current.get(key) === value);
}
