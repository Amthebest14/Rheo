const API_KEY = '875e1017-87b8-4b12-8301-6aa1f1aa073b';
const BASE_URL = 'https://api.saucerswap.finance';

const HEADERS = {
  'x-api-key': API_KEY,
  'Accept': 'application/json',
};

export async function fetchTokenPrices() {
  try {
    const response = await fetch(`${BASE_URL}/tokens`, { headers: HEADERS });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch token prices from SaucerSwap API:', error);
    return null;
  }
}

export async function fetchV2Pools() {
  try {
    const response = await fetch(`${BASE_URL}/v2/pools/full`, { headers: HEADERS });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch V2 Pools from SaucerSwap API:', error);
    return null;
  }
}
