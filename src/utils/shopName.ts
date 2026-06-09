import { storage } from '../db/seedImporter';

export function getShopName(): string {
  return storage.getString('shop_name') ?? 'My Kirana Store';
}

export function getShopNameReceipt(): string {
  return getShopName().toUpperCase();
}
