// lib/db.ts - FIXED VERSION
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Konfigurasi koneksi PostgreSQL yang optimal
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Optimasi untuk environment serverless
  max: 10, // Maximum connections
  min: 2,  // Minimum connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds untuk connection timeout
  
  // Additional stability options
  maxUses: 7500, // Maximum uses per connection
});

// Event handlers untuk monitoring
pool.on('error', (err, client) => {
  console.error('❌ Unexpected pool error:', err.message);
});

pool.on('connect', (client) => {
  console.log('✅ New client connected to database');
});

pool.on('remove', (client) => {
  console.log('🔄 Client removed from pool');
});

/**
 * Enhanced query function with retry mechanism
 */
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params: any[] = [], 
  retries = 3
): Promise<QueryResult<T>> {
  let client: PoolClient | undefined;
  const start = Date.now();
  
  try {
    console.log(`🔵 Executing query: ${text.substring(0, 100)}...`);
    
    // Acquire connection dengan timeout
    const acquirePromise = pool.connect();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection acquire timeout')), 8000)
    );
    
    client = await Promise.race([acquirePromise, timeoutPromise]);
    
    // Set statement timeout untuk query execution
    await client.query('SET statement_timeout = 15000');
    
    // Execute query
    const res = await client.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log(`✅ Query executed in ${duration}ms, rows: ${res.rows.length}`);
    
    return res;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, {
      error: err.message || '',
      code: err.code || '',
      query: text.substring(0, 100),
      params: params.length > 0 ? '[...]' : []
    });

    // Retry logic untuk error yang bisa di-retry
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      '57P01', // admin_shutdown
      '57P03', // cannot_connect_now
      '08006', // connection_failure
      '08003', // connection_does_not_exist
    ];

    const shouldRetry = retries > 0 && (
      retryableErrors.includes(err.code) ||
      err.message?.includes('timeout') ||
      err.message?.includes('terminated') ||
      err.message?.includes('connection') ||
      err.message?.includes('acquire')
    );

    if (shouldRetry) {
      const waitTime = 1000 * (4 - retries); // Exponential backoff: 1s, 2s, 3s
      console.warn(`🔄 Retrying query (${retries} retries left)...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return query<T>(text, params, retries - 1);
    }
    
    throw err;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseErr: any) {
        console.warn('⚠️ Error releasing client:', releaseErr.message);
      }
    }
  }
}

/**
 * Health check function untuk database
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Checking database connection...');
    const result = await query('SELECT NOW() as current_time', [], 2);
    console.log('✅ Database connection healthy:', result.rows[0].current_time);
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get pool statistics untuk monitoring
 */
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Transaction helper
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gracefully close pool
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('✅ Database pool closed gracefully');
  } catch (error: any) {
    console.error('❌ Error closing pool:', error.message);
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    console.log('🛑 Process beforeExit, closing pool...');
    await closePool();
  });

  process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, closing database pool...');
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, closing database pool...');
    await closePool();
    process.exit(0);
  });
}

export default pool;