import { useState, useEffect } from 'react';
import { storage } from '../db/seedImporter';
import { connectToPrinter } from '../utils/bleManager';

export type PrinterState = 'disconnected' | 'connecting' | 'connected';

export function usePrinter() {
  const [printerState, setPrinterState] = useState<PrinterState>('disconnected');

  useEffect(() => {
    let isActive = true;
    const savedPrinterId = storage.getString('saved_printer_id');
    
    if (savedPrinterId) {
      setPrinterState('connecting');
      connectToPrinter(savedPrinterId)
        .then(() => {
          if (isActive) setPrinterState('connected');
        })
        .catch(() => {
          if (isActive) setPrinterState('disconnected');
        });
    }

    return () => {
      isActive = false;
    };
  }, []);

  return { printerState, setPrinterState };
}
