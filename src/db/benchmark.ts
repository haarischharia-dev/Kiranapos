import { SQLiteDatabase } from 'expo-sqlite';

export const benchmarkBarcodeScan = async (db: SQLiteDatabase, barcode: string) => {
  console.log("🚀 Running High-Speed JSI Benchmark...");
  
  try {
    // 1. Prepare the statement ONCE in memory (The secret to speed)
    const statement = await db.prepareAsync('SELECT * FROM products WHERE barcode = $barcode');
    
    const start = performance.now();
    
    // 2. Execute 100 times synchronously, bypassing the async bridge entirely
    for (let i = 0; i < 100; i++) {
      statement.executeSync({ $barcode: barcode }).getFirstSync();
    }
    
    const end = performance.now();
    
    // 3. Free up memory
    await statement.finalizeAsync();
    
    const totalTime = end - start;
    const avgTime = totalTime / 100;
    
    console.log(`⏱️ Total time for 100 reads: ${totalTime.toFixed(2)}ms`);
    console.log(`⚡ Average time per read: ${avgTime.toFixed(2)}ms (SLA: <5ms)`);
    
  } catch (error) {
    console.error("Benchmark failed:", error);
  }
};