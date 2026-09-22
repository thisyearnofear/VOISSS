import { describe, expect, it } from 'vitest';
import { previewRequestBody } from '@/lib/listening-preview';

describe('previewRequestBody', () => {
  it('trims text, caps at 500 characters, and prefers the contract voice id', () => {
    const body = previewRequestBody('  hello  ', {
      id: 'v1',
      contractVoiceId: 'cv1',
    });
    expect(body.text).toBe('hello');
    expect(body.voiceId).toBe('cv1');
    expect(body.preview).toBe(true);
    expect(
      previewRequestBody('x'.repeat(600), { id: 'v1' }).text
    ).toHaveLength(500);
  });

  it('falls back to the catalog id when there is no contract voice id', () => {
    expect(previewRequestBody('x', { id: 'v1' }).voiceId).toBe('v1');
  });

  it('uses the shared demo agent address and omits archetype unless given', () => {
    const body = previewRequestBody('x', { id: 'v1' });
    expect(body.agentAddress).toBe(
      '0xDEMO0000000000000000000000000000000000001'
    );
    expect('archetype' in body).toBe(false);
    expect(previewRequestBody('x', { id: 'v1' }, 'narrator').archetype).toBe(
      'narrator'
    );
  });
});
