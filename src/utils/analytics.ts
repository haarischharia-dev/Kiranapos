import { openDatabase } from '../db/database';

export interface DayCloseSummary {
  totalRevenue: number;
  cashSales: number;
  upiSales: number;
  khataSales: number;
  itemCount: number;
  khataRecovered: number;
}

export const fetchDayCloseSummary = async (): Promise<DayCloseSummary> => {
  const db = await openDatabase();

  const summary: DayCloseSummary = {
    totalRevenue: 0,
    cashSales: 0,
    upiSales: 0,
    khataSales: 0,
    itemCount: 0,
    khataRecovered: 0,
  };

  // 1. Calculate Sales
  const sales = await db.getAllAsync<{ payment_method: string, total_amount: number }>(
    `SELECT payment_method, COALESCE(total_amount, 0) as total_amount 
     FROM sales 
     WHERE date(created_at) = date('now', 'localtime')`
  );

  sales.forEach((s) => {
    summary.totalRevenue += s.total_amount;
    if (s.payment_method === 'cash') summary.cashSales += s.total_amount;
    else if (s.payment_method === 'upi') summary.upiSales += s.total_amount;
    else if (s.payment_method === 'khata') summary.khataSales += s.total_amount;
  });

  // 2. Calculate Item Count
  const itemCountResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COALESCE(SUM(si.quantity), 0) as count 
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE date(s.created_at) = date('now', 'localtime')`
  );
  if (itemCountResult && itemCountResult.count) {
    summary.itemCount = itemCountResult.count;
  }

  // 3. Calculate Khata Recovered (Credits)
  const khataCredits = await db.getFirstAsync<{ recovered: number }>(
    `SELECT COALESCE(SUM(amount), 0) as recovered 
     FROM khata_entries 
     WHERE entry_type = 'credit' AND date(created_at) = date('now', 'localtime')`
  );
  if (khataCredits && khataCredits.recovered) {
    summary.khataRecovered = khataCredits.recovered;
  }

  return summary;
};
