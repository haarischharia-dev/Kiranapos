import { addKhataEntry } from '../khataRepo';
import { SQLiteDatabase } from 'expo-sqlite';

jest.mock('../../utils/telemetry', () => ({
  track: jest.fn()
}));

describe('khataRepo', () => {
  it('adds khata entry and updates balance correctly for debit', async () => {
    const mockDb = {
      withTransactionAsync: jest.fn(async (cb) => {
        await cb();
      }),
      runAsync: jest.fn(),
    } as unknown as SQLiteDatabase;

    await addKhataEntry(mockDb, 'cust-1', 500, 'debit');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE customers SET outstanding_balance = outstanding_balance + ?'),
      [500, 'cust-1']
    );
  });

  it('adds khata entry and updates balance correctly for credit', async () => {
    const mockDb = {
      withTransactionAsync: jest.fn(async (cb) => {
        await cb();
      }),
      runAsync: jest.fn(),
    } as unknown as SQLiteDatabase;

    await addKhataEntry(mockDb, 'cust-1', 200, 'credit');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE customers SET outstanding_balance = outstanding_balance + ?'),
      [-200, 'cust-1']
    );
  });
});
