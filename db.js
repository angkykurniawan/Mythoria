import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mythoria_db'
};

let pool = null;
let isDbConnected = false;

// Default Seed Accounts
export const DEFAULT_USERS = [
  {
    id: 1,
    username: 'admin',
    passwordPlain: 'admin123',
    passwordHash: bcrypt.hashSync('admin123', 10),
    name: 'Sutradara Utama',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: 'penulis',
    passwordPlain: 'user123',
    passwordHash: bcrypt.hashSync('user123', 10),
    name: 'Penulis Naskah',
    role: 'user',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    username: 'pembaca',
    passwordPlain: 'user123',
    passwordHash: bcrypt.hashSync('user123', 10),
    name: 'Kolektor Komik',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

// Fallback in-memory state jika MySQL belum aktif/dikonfigurasi
export const fallbackStore = {
  sessions: new Map(),
  pages: [
    { id: 1, sessionId: 'default-session', pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }
  ],
  manifestations: [],
  characters: [],
  realityScars: [],
  users: [...DEFAULT_USERS]
};

export async function initDatabase() {
  try {
    try {
      const initConn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password
      });
      await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await initConn.end();
    } catch {
      // Abaikan jika tidak memiliki izin CREATE DATABASE di hosting
    }

    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000
    });

    // 1. Tabel Pengguna
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inisialisasi Akun Bawaan jika kosong
    const [existingUsers] = await pool.query(`SELECT COUNT(*) as count FROM users`);
    if (existingUsers[0].count === 0) {
      for (const u of DEFAULT_USERS) {
        await pool.query(
          `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
          [u.username, u.passwordHash, u.name, u.role]
        );
      }
    }

    // 2. Tabel Permainan & Sesi
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT 'Sesi Komik Mythoria',
        stability INT NOT NULL DEFAULT 100,
        ink_jelaga INT NOT NULL DEFAULT 15,
        ink_gold INT NOT NULL DEFAULT 5,
        ink_blood INT NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabel Halaman Buku Realitas (Pages)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        page_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabel Manifestasi Kalimat (Dengan kolom page_number)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manifestations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        page_number INT DEFAULT 1,
        sentence TEXT NOT NULL,
        subject_part VARCHAR(100),
        action_part VARCHAR(100),
        modifier_part VARCHAR(150),
        ink_type ENUM('jelaga', 'emas', 'darah') DEFAULT 'jelaga',
        ai_story TEXT,
        comic_caption VARCHAR(255),
        sound_effect VARCHAR(50) DEFAULT 'POW!',
        is_redacted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tambah kolom page_number jika tabel lama belum memilikinya
    try {
      await pool.query(`ALTER TABLE manifestations ADD COLUMN page_number INT DEFAULT 1;`);
    } catch {
      // Abaikan jika kolom sudah ada
    }

    // 5. Karakter & Glitch
    await pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        name VARCHAR(100) NOT NULL,
        archetype VARCHAR(100) NOT NULL,
        dialogue TEXT,
        special_skill VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reality_scars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        glitch_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isDbConnected = true;
    console.log(`[MySQL] Berhasil terhubung ke database "${dbConfig.database}" di ${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    console.warn(`[MySQL Peringatan] Tidak dapat terhubung ke MySQL (${error.message}).`);
    console.warn(`[MySQL Peringatan] Server tetap berjalan dengan penyimpanan memori internal sementara.`);
    isDbConnected = false;
    return false;
  }
}

export function getDb() {
  return { pool, isConnected: isDbConnected };
}
