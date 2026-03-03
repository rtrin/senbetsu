import { LS_BYOK_PRODUCT_ID, LS_PRO_PRODUCT_ID } from './constants';

const LS_ACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/activate';
const LS_VALIDATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/validate';
const LS_DEACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/deactivate';

interface LicenseValidation {
  valid: boolean;
  tier: 'pro' | 'byok' | null;
  error?: string;
}

function tierFromProductId(productId: string): 'pro' | 'byok' | null {
  if (productId === LS_PRO_PRODUCT_ID) return 'pro';
  if (productId === LS_BYOK_PRODUCT_ID) return 'byok';
  return null;
}

export async function activateLicense(licenseKey: string): Promise<LicenseValidation> {
  try {
    const res = await fetch(LS_ACTIVATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, instance_name: 'senbetsu-chrome' }),
    });

    const data = await res.json();

    if (!data.activated && !data.valid) {
      return { valid: false, tier: null, error: data.error ?? 'Invalid license key' };
    }

    const productId = String(data.meta?.product_id ?? '');
    const tier = tierFromProductId(productId);
    if (!tier) {
      return { valid: false, tier: null, error: 'License is not for a Senbetsu product' };
    }

    return { valid: true, tier };
  } catch {
    return { valid: false, tier: null, error: 'Failed to connect to license server' };
  }
}

export async function validateLicense(licenseKey: string): Promise<LicenseValidation> {
  try {
    const res = await fetch(LS_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, instance_name: 'senbetsu-chrome' }),
    });

    const data = await res.json();

    if (!data.valid) {
      return { valid: false, tier: null, error: data.error ?? 'License is no longer valid' };
    }

    const productId = String(data.meta?.product_id ?? '');
    const tier = tierFromProductId(productId);
    return { valid: !!tier, tier };
  } catch {
    return { valid: false, tier: null, error: 'Failed to connect to license server' };
  }
}

export async function deactivateLicense(licenseKey: string): Promise<boolean> {
  try {
    const res = await fetch(LS_DEACTIVATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, instance_name: 'senbetsu-chrome' }),
    });

    const data = await res.json();
    return data.deactivated === true;
  } catch {
    return false;
  }
}
