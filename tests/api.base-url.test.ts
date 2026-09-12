import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from '../client/src/api.js';

/**
 * The API base URL is a build input, so a bad value cannot be caught at runtime
 * by anyone but the learner - and it would reach them disguised as an offline
 * error. These are the shapes someone deploying this will actually type.
 */
describe('resolveApiBaseUrl', () => {
  it('defaults to same origin', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('');
    expect(resolveApiBaseUrl('')).toBe('');
    expect(resolveApiBaseUrl('   ')).toBe('');
  });

  it('keeps an absolute origin as written', () => {
    expect(resolveApiBaseUrl('https://api.tikerino.example')).toBe('https://api.tikerino.example');
    expect(resolveApiBaseUrl('http://127.0.0.1:8787')).toBe('http://127.0.0.1:8787');
  });

  it('keeps a path prefix, for an API mounted under a subpath', () => {
    expect(resolveApiBaseUrl('https://example.test/tikerino')).toBe('https://example.test/tikerino');
  });

  it('strips trailing slashes, which would otherwise double up against /api', () => {
    expect(resolveApiBaseUrl('https://api.tikerino.example/')).toBe('https://api.tikerino.example');
    expect(resolveApiBaseUrl('https://api.tikerino.example///')).toBe('https://api.tikerino.example');
  });

  it('refuses a bare host or a relative path', () => {
    expect(() => resolveApiBaseUrl('api.tikerino.example')).toThrow(/absolute http\(s\) URL/);
    expect(() => resolveApiBaseUrl('/api')).toThrow(/absolute http\(s\) URL/);
  });

  it('refuses a non-http protocol', () => {
    expect(() => resolveApiBaseUrl('ftp://api.tikerino.example')).toThrow(/http or https/);
  });
});
