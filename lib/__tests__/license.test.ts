import { beforeEach, describe, expect, it, vi } from 'vitest';

const MOCK_PRO_ID = 'prod_pro_123';
const MOCK_BYOK_ID = 'prod_byok_456';

vi.mock('../constants', () => ({
  LS_PRO_PRODUCT_ID: MOCK_PRO_ID,
  LS_BYOK_PRODUCT_ID: MOCK_BYOK_ID,
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { activateLicense, validateLicense, deactivateLicense } = await import('../license');

beforeEach(() => {
  fetchMock.mockReset();
});

describe('activateLicense', () => {
  it('returns valid pro tier when product matches', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        activated: true,
        valid: true,
        meta: { product_id: MOCK_PRO_ID },
      }),
    });

    const result = await activateLicense('test-key');
    expect(result.valid).toBe(true);
    expect(result.tier).toBe('pro');
  });

  it('returns valid byok tier when product matches', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        activated: true,
        valid: true,
        meta: { product_id: MOCK_BYOK_ID },
      }),
    });

    const result = await activateLicense('test-key');
    expect(result.valid).toBe(true);
    expect(result.tier).toBe('byok');
  });

  it('returns invalid when license key is wrong', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ activated: false, valid: false, error: 'Invalid key' }),
    });

    const result = await activateLicense('bad-key');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid key');
  });

  it('returns invalid when product ID is unknown', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        activated: true,
        valid: true,
        meta: { product_id: 'unknown-product' },
      }),
    });

    const result = await activateLicense('test-key');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('License is not for a Senbetsu product');
  });

  it('handles network errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await activateLicense('test-key');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Failed to connect to license server');
  });
});

describe('validateLicense', () => {
  it('returns valid when license is still active', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        valid: true,
        meta: { product_id: MOCK_PRO_ID },
      }),
    });

    const result = await validateLicense('test-key');
    expect(result.valid).toBe(true);
    expect(result.tier).toBe('pro');
  });

  it('returns invalid when license expired', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ valid: false, error: 'License expired' }),
    });

    const result = await validateLicense('test-key');
    expect(result.valid).toBe(false);
  });
});

describe('deactivateLicense', () => {
  it('returns true on successful deactivation', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ deactivated: true }),
    });

    const result = await deactivateLicense('test-key');
    expect(result).toBe(true);
  });

  it('returns false on failure', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ deactivated: false }),
    });

    const result = await deactivateLicense('test-key');
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await deactivateLicense('test-key');
    expect(result).toBe(false);
  });
});
