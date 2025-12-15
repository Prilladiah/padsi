import { Pool, PoolClient, QueryResult as PGQueryResult, QueryResultRow } from 'pg';

// Deklarasi interface untuk PoolConfig untuk menghindari error typescript
interface PoolConfig {
  connectionString?: string;
  ssl?: any;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Konfigurasi koneksi PostgreSQL yang stabil
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Inisialisasi pool
const pool = new Pool(poolConfig);

// Type untuk query result
export interface QueryResult<T extends QueryResultRow = any> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: any[];
}

// Event handlers untuk monitoring
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  console.log('✅ New client connected to database');
});

/**
 * Enhanced query function with retry mechanism
 */
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params: any[] = [], 
  retries = 3
): Promise<QueryResult<T>> {
  let client: PoolClient | null = null;
  const start = Date.now();
  
  try {
    console.log(`🔵 Executing query: ${text.substring(0, 100)}...`);
    
    // Acquire connection
    client = await pool.connect();
    
    // Set statement timeout untuk query execution (jika supported)
    try {
      await client.query('SET statement_timeout = 15000');
    } catch (timeoutErr) {
      // Ignore jika tidak support
    }
    
    // Execute query dengan tipe yang benar
    const res = await client.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log(`✅ Query executed in ${duration}ms, rows: ${res.rows.length}`);
    
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0,
      command: res.command || '',
      oid: res.oid || 0,
      fields: res.fields || []
    };
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, {
      error: err.message || '',
      code: (err as any).code || '',
      query: text.substring(0, 100),
      params: params.length > 0 ? params : []
    });

    // Retry logic
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      '57P01',
      '57P03',
      '08006',
      '08003',
    ];

    const errCode = (err as any).code || '';
    const errMessage = err.message || '';
    
    const shouldRetry = retries > 0 && (
      retryableErrors.includes(errCode) ||
      errMessage.includes('timeout') ||
      errMessage.includes('terminated') ||
      errMessage.includes('connection') ||
      errMessage.includes('acquire')
    );

    if (shouldRetry) {
      const waitTime = 1000 * (4 - retries);
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
    console.log('✅ Database connection healthy:', result.rows[0]?.current_time);
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
  const poolAny = pool as any;
  return {
    total: poolAny.totalCount || 0,
    idle: poolAny.idleCount || 0,
    waiting: poolAny.waitingCount || 0,
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

// Export pool sebagai default dan named
export { pool };
export default {
  pool,
  query,
  checkDatabaseConnection,
  getPoolStats,
  transaction,
  closePool
};