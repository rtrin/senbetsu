import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANTHROPIC_MODEL, requestGrouping } from '../ai-provider';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('requestGrouping', () => {
  it('uses the OpenAI chat completions contract', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ choices: [{ message: { content: '{}' } }] }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestGrouping('openai', 'key', 'system prompt', 'tab list')).resolves.toBe('{}');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer key' }),
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'system prompt' },
            { role: 'user', content: 'tab list' },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      }),
    );
  });

  it('uses the Anthropic messages contract and extracts text blocks only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [
          { type: 'tool_use', input: {} },
          { type: 'text', text: '{}' },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestGrouping('anthropic', 'key', 'system prompt', 'tab list')).resolves.toBe(
      '{}',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'key',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        }),
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 4096,
          system: 'system prompt',
          messages: [{ role: 'user', content: 'tab list' }],
        }),
      }),
    );
  });

  it('uses Gemini generateContent and accepts completed model text only', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{}' }] } }],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestGrouping('gemini', 'key', 'system prompt', 'tab list')).resolves.toBe('{}');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-goog-api-key': 'key' }),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'system prompt' }] },
          contents: [{ role: 'user', parts: [{ text: 'tab list' }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }),
    );
  });

  it('sanitizes provider failures and rejects malformed output', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'secret' }, 401)));
    await expect(requestGrouping('openai', 'key', 'system', 'tabs')).rejects.toThrow(
      'OpenAI API request failed (401).',
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ choices: [] })));
    await expect(requestGrouping('openai', 'key', 'system', 'tabs')).rejects.toThrow(
      'OpenAI returned no usable response.',
    );
  });

  it('reports invalid JSON and timeouts without leaking request details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
    await expect(requestGrouping('gemini', 'key', 'system', 'tabs')).rejects.toThrow(
      'Google returned an invalid response.',
    );
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () => reject(new Error('abort'))),
          ),
      ),
    );
    const result = requestGrouping('anthropic', 'key', 'system', 'tabs');
    const assertion = expect(result).rejects.toThrow('Anthropic request timed out.');
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
    vi.useRealTimers();
  });
});
