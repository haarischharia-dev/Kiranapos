import { useCartStore } from '../cartStore';
import { Product } from '../../types/db';

jest.mock('../../db/seedImporter', () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  }
}));

const mockProduct1: Product = {
  id: '1',
  barcode: '123',
  name: 'Test 1',
  price: 100,
  is_loose: 0,
  stock: 10,
  updated_at: '',
  synced_to_global: 0
};

const mockProduct2: Product = {
  id: '2',
  barcode: '456',
  name: 'Test 2',
  price: 50.5,
  is_loose: 1,
  stock: 10,
  updated_at: '',
  synced_to_global: 0
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds an item to the cart', () => {
    useCartStore.getState().addItem(mockProduct1);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('increments quantity correctly', () => {
    useCartStore.getState().addItem(mockProduct1);
    useCartStore.getState().incrementQuantity(mockProduct1.id);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('decrements quantity correctly', () => {
    useCartStore.getState().addItem(mockProduct1);
    useCartStore.getState().incrementQuantity(mockProduct1.id);
    useCartStore.getState().decrementQuantity(mockProduct1.id);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('removes item when quantity becomes 0', () => {
    useCartStore.getState().addItem(mockProduct1);
    useCartStore.getState().decrementQuantity(mockProduct1.id);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('calculates total correctly', () => {
    useCartStore.getState().addItem(mockProduct1); // 100
    useCartStore.getState().addItem(mockProduct2, 2); // 50.5 * 2 = 101
    expect(useCartStore.getState().getTotal()).toBe(201);
  });
});
