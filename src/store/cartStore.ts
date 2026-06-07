import { create } from 'zustand';
import { Product } from '../types/db';
import { storage } from '../db/seedImporter';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, overrideQuantity?: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  hydrate: () => void;
}

const saveCart = (items: CartItem[]) => {
  storage.set('cart_draft', JSON.stringify(items));
};

function loadDraftFromStorage(): CartItem[] {
  try {
    const draft = storage.getString('cart_draft');
    if (!draft || draft === '[]') return [];
    const parsed = JSON.parse(draft);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return parsed;
  } catch {
    return [];
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  // Bootstrap from MMKV so the cart isn't empty after a force-kill, even before
  // the unfinished-bill alert is answered.
  items: loadDraftFromStorage(),
  addItem: (product, overrideQuantity) => {
    const qtyToAdd = overrideQuantity ?? 1;
    set((state) => {
      const existingItem = state.items.find((item) => item.product.id === product.id);
      let newItems;
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      } else {
        newItems = [...state.items, { product, quantity: qtyToAdd }];
      }
      saveCart(newItems);
      return { items: newItems };
    });
  },
  incrementQuantity: (id) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.product.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newItems);
      return { items: newItems };
    });
  },
  decrementQuantity: (id) => {
    set((state) => {
      const newItems = state.items
        .map((item) =>
          item.product.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
      saveCart(newItems);
      return { items: newItems };
    });
  },
  clearCart: () => {
    // MMKV v4 exposes remove(), not delete() — calling delete() crashes natively.
    storage.remove('cart_draft');
    set({ items: [] });
  },
  getTotal: () => {
    return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },
  hydrate: () => {
    const draft = storage.getString('cart_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.length > 0) {
          set({ items: parsed });
        }
      } catch (e) {
        // fail silently on corrupted json
      }
    }
  }
}));
