import { describe, it, expect } from 'vitest';
import { getAppDisplayName } from './appMeta';

describe('appMeta', () => {
  it('getAppDisplayName returns label', () => {
    expect(getAppDisplayName()).toBe('TTVV Social');
  });
});
