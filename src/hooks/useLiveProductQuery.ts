import { useEffect, useState } from 'react';
import { addDatabaseChangeListener, useSQLiteContext } from 'expo-sqlite';
import { Product } from '../types/db';
import { findByBarcode } from '../db/productRepo';

export function useLiveProductQuery(barcode: string) {
  const db = useSQLiteContext();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    findByBarcode(db, barcode).then(setProduct);

    const sub = addDatabaseChangeListener((event) => {
      if (event.tableName === 'products') {
        findByBarcode(db, barcode).then(setProduct);
      }
    });

    return () => {
      sub.remove();
    };
  }, [db, barcode]);

  return product;
}
