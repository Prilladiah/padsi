// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { query, checkDatabaseConnection, getPoolStats } from '@/lib/db';

export async function GET() {
  const tests: any = {
    timestamp: new Date().toISOString(),
    results: []
  };

  try {
    // Test 1: Pool Stats
    tests.results.push({
      test: 'Pool Statistics',
      status: 'info',
      data: getPoolStats()
    });

    // Test 2: Database Connection
    console.log('🧪 Test 1: Checking database connection...');
    const isHealthy = await checkDatabaseConnection();
    tests.results.push({
      test: 'Database Connection',
      status: isHealthy ? 'pass' : 'fail',
      healthy: isHealthy
    });

    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        tests
      }, { status: 503 });
    }

    // Test 3: Count Records
    console.log('🧪 Test 2: Counting records...');
    const countResult = await query('SELECT COUNT(*) as total FROM stok');
    tests.results.push({
      test: 'Count Records',
      status: 'pass',
      totalRecords: countResult.rows[0].total
    });

    // Test 4: Table Structure
    console.log('🧪 Test 3: Checking table structure...');
    const structure = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'stok'
      ORDER BY ordinal_position
    `);
    tests.results.push({
      test: 'Table Structure',
      status: 'pass',
      columns: structure.rows
    });

    // Test 5: Sample Query
    console.log('🧪 Test 4: Running sample query...');
    const sample = await query('SELECT * FROM stok LIMIT 3');
    tests.results.push({
      test: 'Sample Query',
      status: 'pass',
      sampleCount: sample.rows.length,
      sampleData: sample.rows
    });

    // Test 6: Database Version
    console.log('🧪 Test 5: Checking PostgreSQL version...');
    const version = await query('SELECT version()');
    tests.results.push({
      test: 'PostgreSQL Version',
      status: 'pass',
      version: version.rows[0].version
    });

    console.log('✅ All database tests passed!');

    return NextResponse.json({
      success: true,
      message: 'All database tests passed',
      tests
    });

  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    
    tests.results.push({
      test: 'Error Occurred',
      status: 'fail',
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      message: 'Database tests failed',
      tests,
      error: error.message
    }, { status: 500 });
  }
}