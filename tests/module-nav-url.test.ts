import { expect, it } from 'vitest';
import { moduleNavActive, moduleNavHref } from '@/components/shell/module-nav-url';
it('keeps the chosen cycle and version when changing S&OP views', () => {
  expect(moduleNavHref('/sop?view=supply', new URLSearchParams('cycle=c&version=v&q=old'), ['cycle', 'version'])).toBe('/sop?view=supply&cycle=c&version=v');
});
it('honours an explicitly selected destination version', () => {
  expect(moduleNavHref('/sop?version=new', new URLSearchParams('version=old'), ['version'])).toBe('/sop?version=new');
});
it('matches query-based navigation and ordinary nested routes', () => {
  expect(moduleNavActive('/sop?view=demand', '/sop', new URLSearchParams('view=supply'))).toBe(false);
  expect(moduleNavActive('/sop?view=supply', '/sop', new URLSearchParams('view=supply&cycle=c'))).toBe(true);
  expect(moduleNavActive('/sales/orders', '/sales/orders/order', new URLSearchParams())).toBe(true);
});
