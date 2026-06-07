import { useState, useCallback } from 'react';
import { Vibration } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types/db';
import { openDatabase } from '../db/database';
import { logTapEvent } from '../db/productRepo';

export function parseLooseProductName(product: Product) {
  let pUnit = 'kg';
  let pBaseQty = 1;
  const match = product.name.match(/\(([\d.]+)\s+(kg|liter|grams)\)$/i);
  if (match) {
    pBaseQty = parseFloat(match[1]) || 1;
    pUnit = match[2].toLowerCase();
  }
  const initialDisplayUnit = pUnit === 'grams' ? 'g' : pUnit;
  return { pUnit, pBaseQty, initialDisplayUnit };
}

export function useLooseQuickTap() {
  const addItem = useCartStore((state) => state.addItem);

  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [parsedUnit, setParsedUnit] = useState('kg');
  const [parsedBaseQty, setParsedBaseQty] = useState(1);
  const [displayUnit, setDisplayUnit] = useState('kg');
  const [inputQty, setInputQty] = useState('');
  const [inputAmt, setInputAmt] = useState('');

  const getNormalizedBasePrice = useCallback(
    (currentDisplayUnit: string) => {
      if (!selectedProduct) return 0;

      const isWeight = parsedUnit === 'kg' || parsedUnit === 'grams';
      const pricePerSmall = isWeight
        ? selectedProduct.price / (parsedUnit === 'kg' ? parsedBaseQty * 1000 : parsedBaseQty)
        : selectedProduct.price / (parsedUnit === 'liter' ? parsedBaseQty * 1000 : parsedBaseQty);

      return currentDisplayUnit === 'kg' || currentDisplayUnit === 'liter'
        ? pricePerSmall * 1000
        : pricePerSmall;
    },
    [selectedProduct, parsedUnit, parsedBaseQty]
  );

  const handleQtyChange = useCallback(
    (text: string) => {
      setInputQty(text);
      const qty = parseFloat(text);
      const normPrice = getNormalizedBasePrice(displayUnit);
      if (!isNaN(qty) && normPrice > 0) {
        const amt = qty * normPrice;
        setInputAmt(amt.toFixed(2).replace(/\.00$/, ''));
      } else {
        setInputAmt('');
      }
    },
    [displayUnit, getNormalizedBasePrice]
  );

  const handleAmtChange = useCallback(
    (text: string) => {
      setInputAmt(text);
      const amt = parseFloat(text);
      const normPrice = getNormalizedBasePrice(displayUnit);
      if (!isNaN(amt) && normPrice > 0) {
        const qty = amt / normPrice;
        setInputQty(qty.toFixed(3).replace(/\.?0+$/, ''));
      } else {
        setInputQty('');
      }
    },
    [displayUnit, getNormalizedBasePrice]
  );

  const toggleDisplayUnit = useCallback(() => {
    const isWeight = parsedUnit === 'kg' || parsedUnit === 'grams';
    let newDisplayUnit = displayUnit;

    if (isWeight) {
      newDisplayUnit = displayUnit === 'kg' ? 'g' : 'kg';
    } else {
      newDisplayUnit = displayUnit === 'liter' ? 'ml' : 'liter';
    }

    setDisplayUnit(newDisplayUnit);

    const amt = parseFloat(inputAmt);
    const normPrice = getNormalizedBasePrice(newDisplayUnit);
    if (!isNaN(amt) && normPrice > 0) {
      const qty = amt / normPrice;
      setInputQty(qty.toFixed(3).replace(/\.?0+$/, ''));
    }
  }, [parsedUnit, displayUnit, inputAmt, getNormalizedBasePrice]);

  const closeCalculator = useCallback(() => {
    setCalcModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const openProduct = useCallback(async (product: Product) => {
    Vibration.vibrate(50);

    const { pUnit, pBaseQty, initialDisplayUnit } = parseLooseProductName(product);

    setSelectedProduct(product);
    setParsedUnit(pUnit);
    setParsedBaseQty(pBaseQty);
    setDisplayUnit(initialDisplayUnit);

    const initialAmt = product.price;
    setInputAmt(initialAmt.toString());

    const pricePerSmallestUnit =
      pUnit === 'kg' || pUnit === 'grams'
        ? product.price / (pUnit === 'kg' ? pBaseQty * 1000 : pBaseQty)
        : product.price / (pUnit === 'liter' ? pBaseQty * 1000 : pBaseQty);

    const normBasePrice =
      initialDisplayUnit === 'kg' || initialDisplayUnit === 'liter'
        ? pricePerSmallestUnit * 1000
        : pricePerSmallestUnit;

    setInputQty((initialAmt / normBasePrice).toFixed(3).replace(/\.?0+$/, ''));
    setCalcModalVisible(true);

    try {
      const db = await openDatabase();
      logTapEvent(db, product.id).catch((err) => console.error('Failed to log tap:', err));
    } catch (dbErr) {
      console.error('Failed to open DB for tap logging:', dbErr);
    }
  }, []);

  const handleAddToCart = useCallback(() => {
    if (selectedProduct) {
      const amt = parseFloat(inputAmt);
      if (!isNaN(amt) && amt > 0) {
        const cartMultiplier = amt / selectedProduct.price;
        addItem(selectedProduct, cartMultiplier);
      }
    }
    closeCalculator();
  }, [selectedProduct, inputAmt, addItem, closeCalculator]);

  const qtyShortcuts =
    displayUnit === 'kg' || displayUnit === 'liter'
      ? [
          { label: '1/4', val: 0.25 },
          { label: '1/2', val: 0.5 },
          { label: '3/4', val: 0.75 },
        ]
      : [
          { label: '100', val: 100 },
          { label: '250', val: 250 },
          { label: '500', val: 500 },
          { label: '750', val: 750 },
        ];

  const amtShortcuts = [10, 20, 50, 100];

  return {
    calcModalVisible,
    selectedProduct,
    displayUnit,
    inputQty,
    inputAmt,
    qtyShortcuts,
    amtShortcuts,
    openProduct,
    closeCalculator,
    handleQtyChange,
    handleAmtChange,
    toggleDisplayUnit,
    handleAddToCart,
    clearSelectedIfDeleted: (productId: string) => {
      if (selectedProduct?.id === productId) {
        closeCalculator();
      }
    },
  };
}
