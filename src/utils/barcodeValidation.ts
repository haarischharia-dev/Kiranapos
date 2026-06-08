/** India GS1 company prefix — retail barcodes we accept for now. */
export const INDIAN_GS1_PREFIX = '890';

export function isIndianRetailBarcode(barcode: string): boolean {
  return barcode.trim().startsWith(INDIAN_GS1_PREFIX);
}
