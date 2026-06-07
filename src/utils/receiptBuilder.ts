import { EscPos } from './escpos';

export interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

export const buildSmartReceipt = (
  cartItems: CartItem[],
  todayTotal: number,
  customerName?: string,
  previousDue?: number
): number[] => {
  const bytes: number[] = [];
  const add = (data: number[]) => bytes.push(...data);

  // Init/Reset Printer
  add(EscPos.init());

  // Shop Name (Centered, Bold, Double Size)
  add(EscPos.alignCenter());
  add(EscPos.boldOn());
  add(EscPos.textSizeDouble());
  add(EscPos.text('KIRANA STORE\n'));
  add(EscPos.textSizeNormal());
  add(EscPos.boldOff());
  add(EscPos.feed());

  // Date/Time (Left Aligned)
  add(EscPos.alignLeft());
  const dateStr = new Date().toLocaleString();
  add(EscPos.text(`Date: ${dateStr}\n`));
  if (customerName) {
    add(EscPos.text(`Customer: ${customerName}\n`));
  }
  add(EscPos.feed());

  // Cart Items
  const divider = '--------------------------------\n';
  add(EscPos.text(divider));
  cartItems.forEach(item => {
    add(EscPos.alignLeft());
    add(EscPos.text(`${item.name}\n`));
    add(EscPos.alignRight());
    const subtotal = item.quantity * item.price;
    add(EscPos.text(`${item.quantity} x Rs.${item.price.toFixed(2)} = Rs.${subtotal.toFixed(2)}\n`));
  });
  add(EscPos.alignLeft());
  add(EscPos.text(divider));

  // Totals
  add(EscPos.alignRight());
  add(EscPos.boldOn());
  add(EscPos.text(`Today's Total: Rs. ${todayTotal.toFixed(2)}\n`));
  
  if (previousDue !== undefined && previousDue > 0) {
    add(EscPos.text(`Previous Due: Rs. ${previousDue.toFixed(2)}\n`));
    add(EscPos.text(`Total Payable: Rs. ${(todayTotal + previousDue).toFixed(2)}\n`));
  }
  add(EscPos.boldOff());

  // Clear tear-bar (3-4 line feeds)
  add(EscPos.feed());
  add(EscPos.feed());
  add(EscPos.feed());
  add(EscPos.feed());

  return bytes;
};
