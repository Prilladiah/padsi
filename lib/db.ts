// lib/db.ts
import { Pool } from 'pg';

// Konfigurasi koneksi PostgreSQL yang lebih robust
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Optimasi untuk environment serverless (Vercel)
  max: 10, // Increase max connections
  min: 2,  // Maintain minimum connections
  idleTimeoutMillis: 30000, // Increase idle timeout
  connectionTimeoutMillis: 5000, // Shorter connection timeout
  
  // Hapus acquireTimeoutMillis karena tidak ada di PoolConfig
  // keepAlive sudah dihandle secara internal
  
  // Additional options untuk stability
  maxUses: 7500, // Maximum number of times a connection can be used
});

// Enhanced query function with better error handling
export async function query(text: string, params: any[] = [], retries = 3) {
  let client;
  const start = Date.now();
  
  try {
    console.log(`🔵 Executing query: ${text.substring(0, 100)}...`);
    
    // Timeout untuk acquire connection
    const acquirePromise = pool.connect();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection acquire timeout')), 5000)
    );
    
    client = await Promise.race([acquirePromise, timeoutPromise]);
    
    // Set timeout untuk query execution
    await client.query('SET statement_timeout = 15000');
    
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`✅ Query executed in ${duration}ms, rows: ${res.rows.length}`);
    
    return res;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, {
      error: err.message,
      code: err.code,
      query: text.substring(0, 200),
      params: params
    });

    // Retry logic untuk error koneksi
    if (retries > 0 && (
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNRESET' ||
      err.code === 'ECONNREFUSED' ||
      err.code === '57P01' || // admin_shutdown
      err.code === '57P03' || // cannot_connect_now
      err.message.includes('timeout') ||
      err.message.includes('terminated') ||
      err.message.includes('connection')
    )) {
      console.warn(`🔄 Retrying query (${retries} retries left)...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
      return query(text, params, retries - 1);
    }
    
    throw err;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        console.warn('⚠️ Error releasing client:', releaseErr);
      }
    }
  }
}

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Cleanup pool on process exit
process.on('beforeExit', async () => {
  try {
    await pool.end();
    console.log('✅ Database pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error);
  }
});

// Handle application shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, closing database pool...');
  await pool.end();
  process.exit(0);
});