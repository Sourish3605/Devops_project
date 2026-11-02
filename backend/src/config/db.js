import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbType = process.env.DB_TYPE || 'sqlite';

let sqliteDb = null;
let mysqlPool = null;

if (dbType === 'mysql') {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.DB_NAME || 'community_connect',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true
    });
    console.log('Connected to MySQL database pool');
  } catch (err) {
    console.error('MySQL connection error, falling back to SQLite:', err.message);
  }
}

// Default SQLite setup
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = path.join(dataDir, 'community_connect.sqlite');
sqliteDb = new Database(sqlitePath);
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

/**
 * Universal query runner: executes queries transparently across SQLite or MySQL
 * Handles placeholder translation (? is standard for both)
 */
export async function query(sql, params = []) {
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } catch (err) {
      console.warn('MySQL query failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite execution
  const trimmed = sql.trim().toUpperCase();
  try {
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        insertId: info.lastInsertRowid,
        affectedRows: info.changes
      };
    }
  } catch (err) {
    console.error('SQLite query error:', err.message, 'SQL:', sql, 'Params:', params);
    throw err;
  }
}

/**
 * Convenience method for single row return
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  if (Array.isArray(rows)) {
    return rows[0] || null;
  }
  return rows;
}

export { sqliteDb, mysqlPool };
export default { query, queryOne, sqliteDb, mysqlPool };
