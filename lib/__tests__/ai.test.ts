import { describe, expect, it, vi } from 'vitest';

vi.mock('../ai-provider', () => ({ requestGrouping: vi.fn() }));

const { requestGrouping } = await import('../ai-provider');
const { classifyTabs } = await import('../ai');

describe('classifyTabs', () => {
  it('accepts only submitted tab IDs once and assigns unmatched tabs to Other', async () => {
    (requestGrouping as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify({
        groups: [
          { name: 'Work', tabIds: [1, 1, 99] },
          { name: 'Personal', tabIds: [] },
        ],
      }),
    );

    await expect(
      classifyTabs(
        [
          { tabId: 1, title: 'One', url: 'https://one.test' },
          { tabId: 2, title: 'Two', url: 'https://two.test' },
          { tabId: 3, title: 'Three', url: 'https://three.test' },
        ],
        'openai',
        'key',
      ),
    ).resolves.toEqual([
      { tabId: 1, category: 'Work' },
      { tabId: 2, category: 'Other' },
      { tabId: 3, category: 'Other' },
    ]);
  });

  it.each([
    'null',
    '42',
    '[]',
    '{}',
    '{"groups":[null]}',
    '{"groups":[{"tabIds":[1]}]}',
    '{"groups":[{"name":"Work","tabIds":["1"]}]}',
    '{"groups":[{"name":"   ","tabIds":[1]}]}',
  ])('rejects malformed provider grouping data: %s', async (response) => {
    (requestGrouping as ReturnType<typeof vi.fn>).mockResolvedValue(response);

    await expect(
      classifyTabs([{ tabId: 1, title: 'One', url: 'https://one.test' }], 'openai', 'key'),
    ).rejects.toThrow('AI provider returned invalid grouping data.');
  });
});
