const FALLBACK_FMCG: Record<string, string> = {
  '8901030932223': 'Surf Excel Matic',
  '8901138300262': 'Harpic Power Plus',
  '4902430900010': 'Pantene Advanced Hair Fall Solution'
};

export async function fetchProductFromInternet(barcode: string): Promise<string | null> {
  try {
    // Primary Source: Open Food Facts (Food & Groceries)
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product && data.product.product_name) {
        return data.product.product_name;
      }
    }

    // Secondary Source (Mocked): Web Scraper / Text-Scraping API for Non-Food CPG
    // In a real production app, this would hit a secondary API or a custom scraping lambda
    if (FALLBACK_FMCG[barcode]) {
      return FALLBACK_FMCG[barcode];
    }
    
    return null;
  } catch (err) {
    console.warn(`Failed to fetch product from internet for ${barcode}:`, err);
    // If the network fails, try the fallback anyway since this is a mock and wouldn't fail in a real scenario where the fallback is also a network call. Wait, if it's offline we wouldn't reach here anyway.
    return FALLBACK_FMCG[barcode] || null;
  }
}
