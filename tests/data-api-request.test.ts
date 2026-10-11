import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { assertDesktopRequest } from '@/server/data-api/request';

const local = 'http://127.0.0.1:3011/api/desktop/action';
function request(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers: { 'x-atlas-client': 'desktop', ...headers } });
}

describe('data API actual NextRequest same-origin boundary', () => {
  it('uses the incoming loopback Host after Next normalises the URL', () => {
    const actual = request(local, { host: '127.0.0.1:3011', origin: 'http://127.0.0.1:3011' });
    expect(actual.url).toBe('http://localhost:3011/api/desktop/action');
    expect(() => assertDesktopRequest(actual)).not.toThrow();
  });
  it('uses the public Host with the actual HTTPS internal request protocol', () => {
    const actual = request('https://localhost:3000/api/desktop/action', {
      host: 'atlassystem.online', origin: 'https://atlassystem.online',
    });
    expect(actual.url).toBe('https://localhost:3000/api/desktop/action');
    expect(() => assertDesktopRequest(actual)).not.toThrow();
  });
  it('accepts a canonical IPv6 incoming Host despite loopback normalisation', () => {
    const actual = request('http://[::1]:3011/api/desktop/action', {
      host: '[::1]:3011', origin: 'http://[::1]:3011',
    });
    expect(actual.url).toBe('http://localhost:3011/api/desktop/action');
    expect(() => assertDesktopRequest(actual)).not.toThrow();
  });
  it('preserves an explicit default Host port and canonical browser origin', () => {
    expect(() => assertDesktopRequest(request('https://localhost:3000/api', {
      host: 'atlassystem.online:443', origin: 'https://atlassystem.online',
    }))).not.toThrow();
  });
  it('falls back only to the exact request URL origin when Host is absent', () => {
    expect(() => assertDesktopRequest(request(local, { origin: 'http://localhost:3011' }))).not.toThrow();
    expect(() => assertDesktopRequest(request(local, { origin: 'http://127.0.0.1:3011' }))).toThrow('unexpected origin');
  });
  it.each([
    'http://foreign.example:3011', 'http://127.0.0.1:3012', 'https://127.0.0.1:3011',
    'http://localhost:3011', 'null', '', 'not-an-origin', 'http://user:secret@127.0.0.1:3011',
    'http://127.0.0.1:3011/', 'http://127.0.0.1:3011/api', 'http://127.0.0.1:3011?x=1',
    'http://127.0.0.1:3011#fragment', 'http://127.0.0.1:3011, http://foreign.example',
    'file://127.0.0.1',
  ])('rejects cross-origin or malformed browser Origin %s', (origin) => {
    expect(() => assertDesktopRequest(request(local, { host: '127.0.0.1:3011', origin }))).toThrow('unexpected origin');
  });
  it.each([
    '', 'https://127.0.0.1:3011', '127.0.0.1:3011/path', 'user@127.0.0.1:3011',
    '127.0.0.1:3011,foreign.example', '127.0.0.1:3011?x', '127.0.0.1:3011#x',
    '127.0.0.1:3011\\x', '127.0.0.1%3a3011', '127.1:3011', '2130706433:3011',
    '127.0.0.1:03011', '127.0.0.1:65536', '127.0.0.1:3011 evil',
  ])('rejects injected or noncanonical Host authority %s', (host) => {
    expect(() => assertDesktopRequest(request(local, { host, origin: 'http://127.0.0.1:3011' }))).toThrow('unexpected origin');
  });
  it('ignores forwarded host/protocol spoofing even when they match Origin', () => {
    expect(() => assertDesktopRequest(request(local, {
      host: '127.0.0.1:3011', origin: 'https://foreign.example',
      'x-forwarded-host': 'foreign.example', 'x-forwarded-proto': 'https',
      forwarded: 'host=foreign.example;proto=https',
    }))).toThrow('unexpected origin');
    expect(() => assertDesktopRequest(request(local, {
      origin: 'http://127.0.0.1:3011', 'x-forwarded-host': '127.0.0.1:3011',
    }))).toThrow('unexpected origin');
  });
  it('does not let forwarded headers override a legitimate incoming Host', () => {
    expect(() => assertDesktopRequest(request(local, {
      host: '127.0.0.1:3011', origin: 'http://127.0.0.1:3011',
      'x-forwarded-host': 'foreign.example', 'x-forwarded-proto': 'https',
    }))).not.toThrow();
  });
  it.each([undefined, '', 'browser', 'Desktop'])('still requires the exact client marker %s', (marker) => {
    const actual = request(local, { host: '127.0.0.1:3011', origin: 'http://127.0.0.1:3011' });
    if (marker === undefined) actual.headers.delete('x-atlas-client');
    else actual.headers.set('x-atlas-client', marker);
    expect(() => assertDesktopRequest(actual)).toThrow('use the Atlas data client');
  });
  it('retains the existing no-Origin native client policy', () => {
    expect(() => assertDesktopRequest(request(local))).not.toThrow();
    expect(() => assertDesktopRequest(request(local, { host: 'native-unused-host' }))).not.toThrow();
  });
});
