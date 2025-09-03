import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Create connection pool for YugabyteDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const connectDB = async () => {
  try {
    const client = await pool.connect()
    console.log('✅ Connected to YugabyteDB')
    
    // Test query
    const result = await client.query('SELECT version()')
    console.log('Database version:', result.rows[0].version)
    
    client.release()
    return pool
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export const query = async (text, params) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

export const getClient = () => {
  return pool.connect()
}

export default pool