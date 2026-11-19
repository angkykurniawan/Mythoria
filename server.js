import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDb, fallbackStore, dbConfig, DEFAULT_USERS } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mythoria_celuloid_vintage_secret_key_1984';

// Pengaturan Global AI (Dikelola oleh Admin)
export let systemAiConfig = {
  apiKey: process.env.GEMINI_API_KEY || '',
  selectedModel: 'gemini-1.5-flash'
};

app.use(cors());
app.use(express.json());

// Sajikan berkas statis (Logo, Favicon, Gambar, Build Assets) secara langsung
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Inisialisasi Database MySQL & load system_settings jika ada
initDatabase().then(async () => {
  const { pool, isConnected } = getDb();
  if (isConnected && pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
      const [rows] = await pool.query(`SELECT * FROM system_settings`);
      rows.forEach(r => {
        if (r.setting_key === 'gemini_api_key' && r.setting_value) {
          systemAiConfig.apiKey = r.setting_value;
        }
        if (r.setting_key === 'selected_model' && r.setting_value) {
          systemAiConfig.selectedModel = r.setting_value;
        }
      });
    } catch (e) {
      console.warn('[Settings Load]', e.message);
    }
  }
}).catch(err => {
  console.error('[MySQL Error]', err);
});

// Middleware: Verifikasi Token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Verifikasi Role Admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak: Operasi ini hanya diizinkan untuk Admin.' });
  }
  next();
}

function resolveApiKey(req) {
  const headerKey = req.headers['x-gemini-api-key'];
  const bodyKey = req.body?.apiKey;
  return headerKey || bodyKey || systemAiConfig.apiKey || process.env.GEMINI_API_KEY || '';
}

// ----------------------------------------------------
// 1. ENDPOINT AUTENTIKASI & PENGELOLAAN PENGGUNA
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const { pool, isConnected } = getDb();
  let userFound = null;

  if (isConnected && pool) {
    try {
      const [rows] = await pool.query(`SELECT * FROM users WHERE username = ?`, [username]);
      if (rows.length > 0) {
        userFound = rows[0];
      }
    } catch (err) {
      console.error('[Auth Error]', err);
    }
  }

  if (!userFound) {
    userFound = fallbackStore.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  if (!userFound) {
    return res.status(401).json({ error: 'Username atau password tidak cocok.' });
  }

  const isBcrypt = userFound.password ? userFound.password.startsWith('$2') : false;
  let isPasswordValid = false;

  if (isBcrypt) {
    isPasswordValid = await bcrypt.compare(password, userFound.password);
  } else if (userFound.passwordHash) {
    isPasswordValid = await bcrypt.compare(password, userFound.passwordHash);
  } else if (userFound.passwordPlain) {
    isPasswordValid = userFound.passwordPlain === password;
  } else {
    isPasswordValid = userFound.password === password;
  }

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Username atau password tidak cocok.' });
  }

  const payload = {
    id: userFound.id,
    username: userFound.username,
    name: userFound.name,
    role: userFound.role
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: `Selamat datang kembali, ${userFound.name}!`,
    token,
    user: payload
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { pool, isConnected } = getDb();

  if (isConnected && pool) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, name, role, created_at as createdAt FROM users ORDER BY id ASC`
      );
      return res.json({ success: true, users: rows });
    } catch (err) {
      console.error('[Fetch Users Error]', err);
    }
  }

  const safeUsers = fallbackStore.users.map(({ id, username, name, role, createdAt }) => ({
    id,
    username,
    name,
    role,
    createdAt: createdAt || new Date().toISOString()
  }));

  res.json({ success: true, users: safeUsers });
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, name, role = 'user' } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, dan nama lengkap wajib diisi.' });
  }

  const cleanRole = role === 'admin' ? 'admin' : 'user';
  const cleanUsername = username.trim().toLowerCase();

  const { pool, isConnected } = getDb();

  if (isConnected && pool) {
    try {
      const [exist] = await pool.query(`SELECT id FROM users WHERE username = ?`, [cleanUsername]);
      if (exist.length > 0) {
        return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
        [cleanUsername, passwordHash, name.trim(), cleanRole]
      );

      const newUser = {
        id: result.insertId,
        username: cleanUsername,
        name: name.trim(),
        role: cleanRole,
        createdAt: new Date().toISOString()
      };

      fallbackStore.users.push({ ...newUser, passwordHash });

      return res.status(201).json({
        success: true,
        message: `Pengguna "${name.trim()}" berhasil ditambahkan.`,
        user: newUser
      });
    } catch (err) {
      console.error('[Add User Error]', err);
      return res.status(500).json({ error: `Gagal menyimpan pengguna ke database: ${err.message}` });
    }
  }

  const duplicate = fallbackStore.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (duplicate) {
    return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    username: cleanUsername,
    name: name.trim(),
    role: cleanRole,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  fallbackStore.users.push(newUser);

  res.status(201).json({
    success: true,
    message: `Pengguna "${name.trim()}" berhasil ditambahkan ke sistem memori.`,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    }
  });
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (targetId === 1) {
    return res.status(400).json({ error: 'Akun Master Admin utama tidak boleh dihapus demi keamanan sistem.' });
  }

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' });
  }

  const { pool, isConnected } = getDb();
  if (isConnected && pool) {
    try {
      await pool.query(`DELETE FROM users WHERE id = ?`, [targetId]);
    } catch (err) {
      console.error('[Delete User Error]', err);
    }
  }

  fallbackStore.users = fallbackStore.users.filter(u => u.id !== targetId);

  res.json({
    success: true,
    message: 'Pengguna berhasil dihapus.'
  });
});

// ----------------------------------------------------
// 2. HEALTH & PENGATURAN AI SISTEM (ADMIN)
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfig: {
      hasApiKey: !!systemAiConfig.apiKey,
      selectedModel: systemAiConfig.selectedModel
    }
  });
});

app.get('/api/settings/ai', (req, res) => {
  res.json({
    hasApiKey: !!systemAiConfig.apiKey,
    selectedModel: systemAiConfig.selectedModel
  });
});

app.post('/api/settings/ai', authenticateToken, requireAdmin, async (req, res) => {
  const { apiKey, selectedModel } = req.body;

  if (apiKey !== undefined) systemAiConfig.apiKey = apiKey.trim();
  if (selectedModel) systemAiConfig.selectedModel = selectedModel.trim();

  const { pool, isConnected } = getDb();
  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES ('gemini_api_key', ?), ('selected_model', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [systemAiConfig.apiKey, systemAiConfig.selectedModel]
      );
    } catch (e) {
      console.warn('[DB Save Settings Error]', e.message);
    }
  }

  res.json({
    success: true,
    message: 'Pengaturan Google AI Studio berhasil disimpan untuk seluruh sistem.',
    hasApiKey: !!systemAiConfig.apiKey,
    selectedModel: systemAiConfig.selectedModel
  });
});

app.post('/api/models', async (req, res) => {
  const apiKey = resolveApiKey(req);
  if (!apiKey) {
    return res.status(400).json({
      error: 'API Key Google AI Studio belum dimasukkan.'
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Gagal memverifikasi API Key ke Google AI Studio.'
      });
    }

    // Filter ketat HANYA model Gemini teks/komik yang benar-benar aktif & didukung oleh API key ini
    const usableModels = (data.models || [])
      .filter(m => {
        const id = m.name.replace('models/', '');
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('generateContent') && 
               id.startsWith('gemini-') && 
               !id.includes('embedding') &&
               !id.includes('aqa') &&
               !id.includes('vision');
      })
      .map(m => ({
        id: m.name.replace('models/', ''),
        displayName: m.displayName || m.name.replace('models/', ''),
        description: m.description || ''
      }));

    res.json({
      success: true,
      models: usableModels
    });
  } catch (err) {
    res.status(500).json({
      error: `Koneksi gagal: ${err.message}`
    });
  }
});

// ----------------------------------------------------
// 3. FITUR HALAMAN BUKU (BOOK PAGES MANAGEMENT)
// ----------------------------------------------------
app.get('/api/pages/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId || 'default-session';
  const { pool, isConnected } = getDb();

  if (isConnected && pool) {
    try {
      const [rows] = await pool.query(
        `SELECT id, session_id as sessionId, page_number as pageNumber, title, summary, created_at as createdAt 
         FROM book_pages WHERE session_id = ? ORDER BY page_number ASC`,
        [sessionId]
      );
      if (rows.length > 0) return res.json({ success: true, pages: rows });
    } catch (e) {
      console.warn('[Pages Fetch Error]', e.message);
    }
  }

  const sPages = fallbackStore.pages.filter(p => p.sessionId === sessionId);
  if (sPages.length === 0) {
    const initPage = { id: 1, sessionId, pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' };
    fallbackStore.pages.push(initPage);
    return res.json({ success: true, pages: [initPage] });
  }

  res.json({ success: true, pages: sPages });
});

app.post('/api/pages', async (req, res) => {
  const { sessionId = 'default-session', title } = req.body;
  const { pool, isConnected } = getDb();

  let nextPageNumber = 1;

  if (isConnected && pool) {
    try {
      const [maxRows] = await pool.query(
        `SELECT MAX(page_number) as maxPage FROM book_pages WHERE session_id = ?`,
        [sessionId]
      );
      nextPageNumber = (maxRows[0]?.maxPage || 0) + 1;
      const cleanTitle = title || `Halaman ${nextPageNumber}: Lembaran Misteri`;

      const [insertRes] = await pool.query(
        `INSERT INTO book_pages (session_id, page_number, title) VALUES (?, ?, ?)`,
        [sessionId, nextPageNumber, cleanTitle]
      );

      const newPage = {
        id: insertRes.insertId,
        sessionId,
        pageNumber: nextPageNumber,
        title: cleanTitle,
        createdAt: new Date().toISOString()
      };
      return res.status(201).json({ success: true, page: newPage });
    } catch (e) {
      console.error('[Add Page DB Error]', e);
    }
  }

  const currentPages = fallbackStore.pages.filter(p => p.sessionId === sessionId);
  nextPageNumber = currentPages.length > 0
    ? Math.max(...currentPages.map(p => Number(p.pageNumber) || 0)) + 1
    : 1;
  const cleanTitle = title || `Halaman ${nextPageNumber}: Lembaran Misteri`;
  const newPage = {
    id: Date.now(),
    sessionId,
    pageNumber: nextPageNumber,
    title: cleanTitle,
    createdAt: new Date().toISOString()
  };
  fallbackStore.pages.push(newPage);

  res.status(201).json({ success: true, page: newPage });
});

// Hapus Halaman Naskah Beserta Seluruh Detailnya
app.delete('/api/pages/:sessionId/:pageNumber', async (req, res) => {
  const sessionId = req.params.sessionId || 'default-session';
  const pageNumber = parseInt(req.params.pageNumber, 10);
  const { pool, isConnected } = getDb();

  if (isConnected && pool) {
    try {
      await pool.query(
        `DELETE FROM book_pages WHERE session_id = ? AND page_number = ?`,
        [sessionId, pageNumber]
      );
      await pool.query(
        `DELETE FROM manifestations WHERE session_id = ? AND page_number = ?`,
        [sessionId, pageNumber]
      );
      await pool.query(
        `DELETE FROM reality_scars WHERE session_id = ? AND glitch_description LIKE ?`,
        [sessionId, `%Halaman ${pageNumber}%`]
      );
    } catch (e) {
      console.warn('[Delete Page DB Error]', e.message);
    }
  }

  fallbackStore.pages = fallbackStore.pages.filter(
    p => !(p.sessionId === sessionId && Number(p.pageNumber) === pageNumber)
  );
  fallbackStore.manifestations = fallbackStore.manifestations.filter(
    m => !(m.sessionId === sessionId && Number(m.pageNumber) === pageNumber)
  );
  fallbackStore.characters = fallbackStore.characters.filter(
    c => !(c.sessionId === sessionId && Number(c.pageNumber) === pageNumber)
  );
  fallbackStore.realityScars = fallbackStore.realityScars.filter(
    s => !(
      s.sessionId === sessionId &&
      (Number(s.pageNumber) === pageNumber || (s.description || '').includes(`Halaman ${pageNumber}`))
    )
  );

  res.json({
    success: true,
    deletedPage: pageNumber,
    message: `Halaman ${pageNumber} beserta seluruh panel, karakter, dan catatannya berhasil dihapus.`
  });
});

// Helper: Panggil Gemini dengan Deteksi Kuota Limit (Rate Limit / Quota Exceeded)
async function callGemini(apiKey, modelId, prompt) {
  const cleanModel = modelId ? modelId.replace('models/', '') : (systemAiConfig.selectedModel || 'gemini-1.5-flash');
  const keyToUse = apiKey || systemAiConfig.apiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${keyToUse}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error?.message || '';
    const isLimit = res.status === 429 || 
                    errorMsg.includes('RESOURCE_EXHAUSTED') || 
                    errorMsg.toLowerCase().includes('quota') || 
                    errorMsg.toLowerCase().includes('rate limit');

    if (isLimit) {
      const quotaErr = new Error('QUOTA_EXCEEDED');
      quotaErr.isQuota = true;
      throw quotaErr;
    }
    throw new Error(errorMsg || 'Gemini API Error');
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Tidak ada respon teks dari model AI.');
  return JSON.parse(rawText);
}

// Generator Cerita Cerdas untuk Fallback (Alami, Santai, Tidak Kaku / Tidak Formal)
function generateIntelligentStoryFallback(sentence, pageNumber, storyHistory, panelCount = 5, characterBible = null) {
  const clean = sentence.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  let result = null;

  // 1. TEMA: PENEMUAN PROFESOR & PESAWAT BAJAJ (Hanya jika secara spesifik menyebut bajaj atau profesor bum)
  if (lower.includes('bajaj') || (lower.includes('profesor') && lower.includes('bum'))) {
    result = {
      theme: 'retro_invention',
      comicCaption: `PENEMUAN SPEKTAKULER: PESAWAT BAJAJ SIAP TERBANG!`,
      soundEffect: `DDD ... DDTT ....`,
      visualScene: `Profesor bangga memamerkan pesawat bajaj kuning bersayap kepada Bum yang heran di laboratorium.`,
      storyOutcome: `Mesin pesawat bajaj kuning menderu kencang membelah landasan dengan getaran hebat.`,
      panelDialogue: `"Bagaimana, Bum? Keren banget kan pesawat buatan ayah?"`,
      branchingOptions: [
        { label: "Terbang Menembus Awan Uji Coba ke Spanyol", targetOffset: 1 },
        { label: "Perbaiki Dulu Baling-Baling di Laboratorium", targetOffset: 2 }
      ],
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'vehicle_intro',
          expression: 'excited',
          sfx: 'DDD ... DDTT ....',
          dialogues: [
            { speaker: 'Profesor', text: 'BAGAIMANA, BUM? PESAWAT BUATAN AYAH KEREN BANGET, KAN?!', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'lab_banter',
          expression: 'smirk',
          dialogues: [
            { speaker: 'Bum', text: 'AH, BIASA SAJA, YAH. MALAH MIRIP BAJAJ BEGITU!', tail: 'right', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'mid_right',
          scene: 'tablet_plan',
          expression: 'confident',
          dialogues: [
            { speaker: 'Profesor', text: 'KALI INI PASTI BERHASIL! AYO KITA TERBANG KE SPANYOL!', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 4,
          panelType: 'bottom_left',
          scene: 'cockpit_reassure',
          expression: 'shocked',
          dialogues: [
            { speaker: 'Bum', text: 'APA?! BENARAN BISA SAMPAI KE STADION SANTIAGO BERNABEU?!', tail: 'right', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 5,
          panelType: 'bottom_right',
          scene: 'boy_shock',
          expression: 'panicked',
          dialogues: [
            { speaker: 'Bum', text: 'SEMOGA SAJA TIDAK MOGOK DI TENGAH LAUTAN...', tail: 'center', bubbleType: 'thought' }
          ]
        }
      ]
    };
  } else if (lower.includes('masa depan') || lower.includes('robot') || lower.includes('gratis') || lower.includes('angkasa') || lower.includes('alien') || lower.includes('teknologi') || lower.includes('pesawat') || lower.includes('kota')) {
    // 2. TEMA: SCI-FI / MASA DEPAN / ROBOT / ANTARIKSA / TEKNOLOGI
    result = {
      theme: 'scifi',
      comicCaption: `ERA BARU MASA DEPAN: ${clean.toUpperCase().slice(0, 48)}!`,
      soundEffect: `BZZZZT-WHOOOSH!`,
      visualScene: `Kota futuristik yang megah dengan mobil-mobil terbang dan gedung pencakar langit berlampu neon cerah.`,
      storyOutcome: `Perubahan peradaban telah terjadi. Fenomena "${clean}" menjadi kenyataan baru yang dinikmati seluruh warga kota.`,
      panelDialogue: `"Gila, ini beneran gratis?! Hidup kita akhirnya bebas dari tagihan!"`,
      branchingOptions: [
        { label: `Jelajahi Fasilitas Kota Gratis dan Nikmati Teknologi Baru`, targetOffset: 1 },
        { label: `Selidiki Siapa Sosok Jenius di Balik Sistem Gratis Ini`, targetOffset: 2 }
      ],
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'scifi_future',
          expression: 'excited',
          sfx: 'BZZZZT-WHOOOSH!',
          dialogues: [
            { speaker: 'Leo', text: `LIHAT DI DEPAN SANA! ${clean.toUpperCase()}!`, tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'scifi_shock',
          expression: 'shocked',
          dialogues: [
            { speaker: 'Maya', text: 'APA?! INI SERIUS?! SEMUA ORANG BENAR-BENAR BISA MENIKMATINYA?!', tail: 'right', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'mid_right',
          scene: 'scifi_cheer',
          expression: 'confident',
          sfx: 'KLIK-CLANG!',
          dialogues: [
            { speaker: 'Leo', text: 'TENTU SAJA! AKHIRNYA IMPIAN KITA TERCAPAI TANPA BEBAN!', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 4,
          panelType: 'bottom_left',
          scene: 'scifi_crowd',
          expression: 'furious',
          sfx: 'YAAAY!',
          dialogues: [
            { speaker: 'Warga Kota', text: 'SELAMAT TINGGAL ZAMAN SUSAH! KITA BEBAS MELAKUKAN APA SAJA!', tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 5,
          panelType: 'bottom_right',
          scene: 'scifi_cliff',
          expression: 'smirk',
          dialogues: [
            { speaker: 'Leo', text: 'TAPI TUNGGU DULU... APA TIDAK ADA JEBAKAN DI BALIK SEMUA INI?', tail: 'center', bubbleType: 'thought' }
          ]
        }
      ]
    };
  } else if (lower.includes('sihir') || lower.includes('naga') || lower.includes('pedang') || lower.includes('penyihir') || lower.includes('istana') || lower.includes('kerajaan') || lower.includes('ksatria')) {
    // 3. TEMA: FANTASI / SIHIR / NAGA / PEDANG
    result = {
      theme: 'fantasy',
      comicCaption: `GELEGAR DUNIA FANTASI: ${clean.toUpperCase().slice(0, 48)}!`,
      soundEffect: `KRAAASH-BLAZE!`,
      visualScene: `Langit bercahaya mistis saat kekuatan magis meledak di hadapan para pengelana.`,
      storyOutcome: `Kekuatan magis luar biasa meledak. Peristiwa "${clean}" mengguncang seantero kerajaan.`,
      panelDialogue: `"Aura ini kuat sekali... bersiaplah bertarung!"`,
      branchingOptions: [
        { label: `Hunuskan Pedang dan Hadapi Ancaman Secara Langsung`, targetOffset: 1 },
        { label: `Gunakan Mantra Pelindung dan Mundur ke Benteng`, targetOffset: 2 }
      ],
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'fantasy_strike',
          expression: 'furious',
          sfx: 'KRAAASH-BLAZE!',
          dialogues: [
            { speaker: 'Ken', text: `AWAS SEMUANYA! ${clean.toUpperCase()}!`, tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'fantasy_gasp',
          expression: 'shocked',
          dialogues: [
            { speaker: 'Elena', text: 'KAU GILA?! KEKUATANNYA TERLALU BESAR UNTUK DILAWAN SENDIRIAN!', tail: 'right', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'mid_right',
          scene: 'fantasy_sword',
          expression: 'confident',
          sfx: 'SHINGGG!',
          dialogues: [
            { speaker: 'Ken', text: 'TENANG SAJA! KITA SUDAH BERLATIH UNTUK HARI SEPERTI INI!', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 4,
          panelType: 'bottom_left',
          scene: 'fantasy_clash',
          expression: 'screaming',
          sfx: 'BOOOOM!',
          dialogues: [
            { speaker: 'Elena', text: 'SERANGANMU TEPAT MENGENAI SASARAN!', tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 5,
          panelType: 'bottom_right',
          scene: 'fantasy_end',
          expression: 'awakened',
          dialogues: [
            { speaker: 'Ken', text: 'APA INI AKHIR DARI PERTARUNGAN, ATAU BARU PERMULAAN...?', tail: 'center', bubbleType: 'thought' }
          ]
        }
      ]
    };
  } else {
    // 4. TEMA: UMUM DINAMIS DENGAN BAHASA SANTAI & TIDAK FORMAL
    result = {
      theme: 'action',
      comicCaption: `KEJADIAN LUAR BIASA: ${clean.toUpperCase().slice(0, 48)}!`,
      soundEffect: `KRAAK-WHOOSH!`,
      visualScene: `Seluruh suasana bergetar saat peristiwa "${clean}" terjadi secara nyata di hadapan para tokoh.`,
      storyOutcome: `Dunia di sekitar berubah drastis setelah "${clean}" terjadi.`,
      panelDialogue: `"Lihat itu! Ini bukan mimpi, semuanya beneran terjadi!"`,
      branchingOptions: [
        { label: `Lanjutkan Penyelidikan Lebih Jauh`, targetOffset: 1 },
        { label: `Berhenti Sejenak dan Susun Strategi Baru`, targetOffset: 2 }
      ],
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'action_start',
          expression: 'excited',
          sfx: 'KRAAK-WHOOSH!',
          dialogues: [
            { speaker: 'Rian', text: `HEY, LIHAT! ${clean.toUpperCase()}!`, tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'action_react',
          expression: 'shocked',
          dialogues: [
            { speaker: 'Sora', text: 'SERIUSAN?! BAGAIMANA BISA HAL SEPERTI ITU BENERAN TERJADI?!', tail: 'right', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'mid_right',
          scene: 'action_cheer',
          expression: 'furious',
          sfx: 'WHAAAAM!',
          dialogues: [
            { speaker: 'Rian', text: 'AKU JUGA KAGET, TAPI SEMUANYA NYATA DI DEPAN MATA KITA!', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 4,
          panelType: 'bottom_left',
          scene: 'action_impact',
          expression: 'screaming',
          sfx: 'BOOOOM!',
          dialogues: [
            { speaker: 'Sora', text: 'GILA KEREN BANGET! KITA HARUS DUKUNG INI SAMPAI SELESAI!', tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 5,
          panelType: 'bottom_right',
          scene: 'action_think',
          expression: 'smirk',
          dialogues: [
            { speaker: 'Rian', text: 'PETUALANGAN KITA MASIH PANJANG... APA YANG AKAN TERJADI SELANJUTNYA?', tail: 'center', bubbleType: 'thought' }
          ]
        }
      ]
    };
  }

  // Terapkan Bible Karakter jika ada
  if (characterBible && result?.comicPanels) {
    const pName = characterBible.protagonistName || 'Rian';
    const cName = characterBible.companionName || 'Maya';
    result.comicPanels.forEach((p, idx) => {
      if (p.dialogues && p.dialogues.length > 0) {
        p.dialogues.forEach(d => {
          if (idx % 2 === 0) {
            d.speaker = pName;
          } else {
            d.speaker = cName;
          }
        });
      }
    });
    if (result.panelDialogue) {
      result.panelDialogue = `"${result.panelDialogue.replace(/^"|"$/g, '')}" - ${pName}`;
    }
  }

  // Potong jumlah panel agar tepat sesuai panelCount (misal 3, 4, atau 5)
  if (result.comicPanels && result.comicPanels.length > panelCount) {
    result.comicPanels = result.comicPanels.slice(0, panelCount);
  }

  return result;
}

// ----------------------------------------------------
// 4. MANIFESTASI KALIMAT (KONTINUITAS & BEBAS TULIS)
// ----------------------------------------------------
app.post('/api/manifest', async (req, res) => {
  const apiKey = resolveApiKey(req);
  const activeModel = req.body?.model || systemAiConfig.selectedModel || 'gemini-1.5-flash';
  const { 
    sentence, 
    subject, 
    action, 
    modifier, 
    inkType = 'jelaga', 
    sessionId = 'default-session',
    pageNumber = 1,
    storyHistory = '',
    characterBible = null,
    layoutType = '5-panel',
    characterStyle = 'auto'
  } = req.body;

  if (!sentence || !sentence.trim()) {
    return res.status(400).json({ error: 'Naskah kalimat manifestasi tidak boleh kosong.' });
  }

  // Hitung jumlah panel sesuai variasi grid yang dipilih sebelum request (hemat token)
  const panelCount = layoutType === '3-panel' ? 3 : layoutType === '4-panel' ? 4 : 5;

  const charBibleBlock = characterBible ? `
KONSISTENSI BIBLE KARAKTER (WAJIB DIIKUTI 100%):
- Tokoh Utama: "${characterBible.protagonistName || 'Rian'}" (${characterBible.protagonistArchetype || 'Protagonis Utama'})
  * Ciri Fisik/Pakaian: ${characterBible.protagonistAppearance || 'Jubah hitam berkerah tinggi'}
  * Kepribadian: ${characterBible.protagonistPersonality || 'Cerdas dan berani'}
${characterBible.companionName ? `- Tokoh Pendamping: "${characterBible.companionName}" (${characterBible.companionArchetype || 'Kawan'})
  * Ciri Fisik/Pakaian: ${characterBible.companionAppearance || 'Jaket kulit dan goggle'}` : ''}
* ATURAN TOKOH & SPEAKER: Dalam setiap dialog, gunakan nama tokoh utama "${characterBible.protagonistName || 'Rian'}" atau tokoh kawan "${characterBible.companionName || 'Maya'}". Pertahankan ciri fisik mereka di setiap deskripsi adegan!
` : '';

  let aiResult = null;
  if (apiKey) {
    try {
      const prompt = `
Anda adalah Sutradara & Penulis Naskah Komik Kreatif (Gaya Manga, Webtoon, Marvel, Komik Populer) untuk sistem Mythoria.

FORMAT GRID KOMIK YANG DIMINTA PENULIS:
- Format: ${layoutType.toUpperCase()}
- SANGAT PENTING (MENGHEMAT TOKEN): Buatlah TEPAT ${panelCount} PANEL cerita berurutan (Panel 1 sampai Panel ${panelCount})! Jangan membuat lebih atau kurang dari ${panelCount} panel!

${charBibleBlock}

ATURAN PALING PENTING:
1. GAYA BAHASA HARUS ALAMI, SANTAI, DAN TIDAK KAKU / TIDAK FORMAL:
   - Gunakan dialog percakapan komik yang seru, emosional, santai, dan berjiwa manusia (contoh: "Gila, ini beneran?!", "Lihat gedung itu!", "Jangan gegabah, kawan!", "Wah, akhirnya berhasil!").
   - JANGAN PERNAH gunakan bahasa formal, birokrasi, atau robotik seperti "Hukum realitas melengkung" atau "Karena naskah telah menuliskannya secara pasti".
2. NAMA TOKOH (SPEAKER) HARUS NAMA ORANG / KARAKTER MANUSIA:
   - Tokoh ditentukan mengikuti Bible Karakter di atas atau kebutuhan cerita Anda! Berikan nama tokoh yang keren dan natural (contoh: "${characterBible?.protagonistName || 'Rian'}", "${characterBible?.companionName || 'Maya'}", "Warga Kota", "Kapten Vane").
   - JANGAN PERNAH memakai kata benda abstrak atau potongan naskah sebagai nama speaker (JANGAN gunakan "[FILM MASA DEPAN]" atau "[PERISTIWA]").
3. CERITA 100% MENGIKUTI NASKAH & MEMPERHATIKAN MEMORI SEBELUMNYA:
   - Kembangkan naskah penulis di bawah ini menjadi adegan komik ${panelCount} panel yang dramatis, menyenangkan, dan hidup!

KONTEKS / PERISTIWA DARI HALAMAN SEBELUMNYA (MEMORI CERITA):
${storyHistory ? `"${storyHistory}"` : "(Ini adalah panel awal pembuka cerita.)"}

SEKARANG, DI HALAMAN ${pageNumber}, PENULIS MENULISKAN NASKAH BERIKUT:
"${sentence}"

Jenis Tinta: "${inkType}"

INSTRUKSI SUTRADARA KOMIK:
1. Sambungkan adegan ini secara RUNTUT dan SINEMATIK dengan kejadian sebelumnya jika ada!
2. Buat adegan komik multi-panel yang seru, hidup, dan dramatis sebanyak TEPAT ${panelCount} panel berurutan!
3. Berikan respon JSON valid dengan format:
{
  "theme": "scifi | fantasy | noir | horror | adventure | cyber | retro_invention | projector | action",
  "characterStyle": "scifi | fantasy | noir | inventor | female_hero | action",
  "comicCaption": "Teks narasi di kotak komik huruf kapital tebal (maks 15 kata)",
  "soundEffect": "Efek suara komik dramatis (contoh: KRAAK! / BZZZT! / BOOM! / KLIK!)",
  "visualScene": "Deskripsi detail komposisi visual panel komik yang dramatis (maks 35 kata)",
  "storyOutcome": "Konsekuensi nyata di dunia yang terjadi secara fisik dan menjelaskan secara gamblang apa yang terjadi (maks 40 kata)",
  "panelDialogue": "Satu kutipan dialog karakter utama yang santai dan ekspresif (maks 20 kata)",
  "branchingOptions": [
    { "label": "Pilihan kelanjutan A...", "targetOffset": 1 },
    { "label": "Pilihan kelanjutan B...", "targetOffset": 2 }
  ],
  "comicPanels": [
    ${Array.from({ length: panelCount }, (_, i) => `{
      "panelNumber": ${i + 1},
      "panelType": "${i === 0 ? 'wide_top' : i === panelCount - 1 ? 'bottom_right' : 'mid_left'}",
      "scene": "scene_step_${i + 1}",
      "sfx": "SFX_PANEL_${i + 1}",
      "expression": "${i === 0 ? 'excited' : i === 1 ? 'shocked' : i === 2 ? 'furious' : i === 3 ? 'screaming' : 'smirk'}",
      "dialogues": [
        { "speaker": "${i % 2 === 0 ? (characterBible?.protagonistName || 'Rian') : (characterBible?.companionName || 'Maya')}", "text": "Kutipan dialog komik huruf kapital!", "tail": "${i % 2 === 0 ? 'left' : 'right'}", "bubbleType": "${i === panelCount - 1 ? 'thought' : 'speech'}" }
      ]
    }`).join(',\n    ')}
  ]
}
      `;
      aiResult = await callGemini(apiKey, activeModel, prompt);
    } catch (err) {
      if (err.isQuota || err.message === 'QUOTA_EXCEEDED') {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'Batas kuota token AI Google Studio telah habis (Limit). Silakan hubungi Administrator sistem!'
        });
      }
      console.warn('[Gemini Call Failed, using fallback]', err.message);
    }
  }

  if (!aiResult) {
    aiResult = generateIntelligentStoryFallback(sentence, pageNumber, storyHistory, panelCount, characterBible);
  }

  const { pool, isConnected } = getDb();
  let insertedId = Date.now();

  if (isConnected && pool) {
    try {
      await pool.query(
        `INSERT IGNORE INTO game_sessions (id, title) VALUES (?, ?)`,
        [sessionId, 'Sesi Komik Mythoria']
      );

      const [insertRes] = await pool.query(
        `INSERT INTO manifestations 
         (session_id, page_number, sentence, subject_part, action_part, modifier_part, ink_type, ai_story, comic_caption, sound_effect)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          pageNumber,
          sentence,
          subject || '',
          action || '',
          modifier || '',
          inkType,
          aiResult.storyOutcome,
          aiResult.comicCaption,
          aiResult.soundEffect
        ]
      );
      insertedId = insertRes.insertId;
    } catch (err) {
      console.error('[DB Insert Error]', err);
    }
  }

  const manifestationData = {
    id: insertedId,
    sessionId,
    pageNumber: parseInt(pageNumber, 10) || 1,
    sentence,
    subject,
    action,
    modifier,
    inkType,
    layoutType: layoutType || '5-panel',
    characterStyle: aiResult.characterStyle || (characterStyle !== 'auto' ? characterStyle : undefined),
    characterBible: characterBible || undefined,
    storyHistory: storyHistory || undefined,
    aiStory: aiResult.storyOutcome,
    comicCaption: aiResult.comicCaption,
    soundEffect: aiResult.soundEffect,
    visualScene: aiResult.visualScene,
    panelDialogue: aiResult.panelDialogue,
    comicPanels: aiResult.comicPanels || [],
    branchingOptions: aiResult.branchingOptions || [],
    theme: aiResult.theme || 'action',
    isRedacted: false,
    createdAt: new Date().toISOString()
  };
  fallbackStore.manifestations.unshift(manifestationData);

  res.json({
    success: true,
    data: manifestationData
  });
});

// ----------------------------------------------------
// 5. HYBRID RENDERING MODE: GENERASI GAMBAR AI (IMAGEN / GEMINI COMIC ENGINE)
// ----------------------------------------------------

// Generator Panel Komik Klasik Retro SVG (Jaminan 100% Visual Selalu Siap & Anti-Error)
function generateVintageComicSvg(scenePrompt, theme = 'action', characterBible = null, panelNumber = 1) {
  const safeScene = String(scenePrompt || 'Adegan Aksi Heroik Komik Klasik')
    .replace(/[<>&"']/g, '')
    .trim();
  const charName = String(characterBible?.protagonistName || 'PAHLAWAN UTAMA')
    .replace(/[<>&"']/g, '')
    .trim();
  const charDesc = String(characterBible?.protagonistAppearance || 'Jubah gelap, mata bersinar tekad')
    .replace(/[<>&"']/g, '')
    .trim();

  // Palet Warna Komik Retro Sesuai Tema
  const bgGrad = theme === 'noir' 
    ? ['#090d16', '#1e293b', '#fbbf24'] 
    : theme === 'fantasy' 
      ? ['#3b0764', '#7e22ce', '#fde047'] 
      : theme === 'scifi' 
        ? ['#0369a1', '#0284c7', '#38bdf8'] 
        : ['#991b1b', '#ea580c', '#facc15'];

  // Variasi visual dinamis berdasarkan nomor panel (1: Panorama, 2: Interior, 3: Aksi, 4: Konfrontasi, 5: Climax)
  const isCloseUp = panelNumber === 5;
  const isDuo = panelNumber === 4;
  const isPanorama = panelNumber === 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="panelGrad${panelNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGrad[0]}" />
      <stop offset="60%" stop-color="${bgGrad[1]}" />
      <stop offset="100%" stop-color="${bgGrad[2]}" />
    </linearGradient>
    <pattern id="halftone${panelNumber}" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.5" fill="#000000" opacity="0.16" />
    </pattern>
    <filter id="comicGlow${panelNumber}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#000" />
    </filter>
  </defs>

  <!-- Latar Belakang Gradien Komik & Tekstur Halftone Cetak -->
  <rect width="600" height="400" fill="url(#panelGrad${panelNumber})" />
  <rect width="600" height="400" fill="url(#halftone${panelNumber})" />

  <!-- Garis Aksi Kecepatan Komik (Speedburst Rays) -->
  <g stroke="#ffffff" stroke-width="2" opacity="0.25" stroke-dasharray="16 10">
    <line x1="300" y1="200" x2="0" y2="0" />
    <line x1="300" y1="200" x2="600" y2="0" />
    <line x1="300" y1="200" x2="600" y2="400" />
    <line x1="300" y1="200" x2="0" y2="400" />
    <line x1="300" y1="200" x2="300" y2="0" />
    <line x1="300" y1="200" x2="300" y2="400" />
    <line x1="300" y1="200" x2="0" y2="200" />
    <line x1="300" y1="200" x2="600" y2="200" />
  </g>

  <!-- Siluet Pemandangan Kota & Arsitektur Komik Sinematik -->
  <g fill="#0f172a" opacity="0.88">
    <rect x="30" y="${isPanorama ? '160' : '200'}" width="70" height="240" />
    <rect x="110" y="${isPanorama ? '130' : '170'}" width="85" height="270" />
    <rect x="205" y="${isPanorama ? '190' : '230'}" width="60" height="210" />
    <rect x="340" y="${isPanorama ? '150' : '190'}" width="95" height="250" />
    <rect x="445" y="${isPanorama ? '180' : '220'}" width="75" height="220" />
    <rect x="530" y="${isPanorama ? '140' : '180'}" width="65" height="260" />
  </g>

  <!-- Jendela-Jendela Gedung Menyala -->
  <g fill="#fef08a" opacity="0.75">
    <rect x="125" y="190" width="10" height="15" />
    <rect x="150" y="190" width="10" height="15" />
    <rect x="125" y="220" width="10" height="15" />
    <rect x="150" y="220" width="10" height="15" />
    <rect x="360" y="210" width="12" height="18" />
    <rect x="390" y="210" width="12" height="18" />
    <rect x="360" y="245" width="12" height="18" />
    <rect x="390" y="245" width="12" height="18" />
  </g>

  ${isCloseUp ? `
  <!-- Panel 5: Close-Up Ekspresi Hero Wajah Komik Penuh Emosi -->
  <g transform="translate(180, 50)" filter="url(#comicGlow${panelNumber})">
    <circle cx="120" cy="120" r="85" fill="#fed7aa" stroke="#000" stroke-width="4" />
    <!-- Rambut Heroik -->
    <path d="M40 90 Q 70 20 120 20 Q 170 20 200 90 Q 215 45 180 25 Q 120 0 60 25 Q 25 45 40 90 Z" fill="#1e1b4b" stroke="#000" stroke-width="3" />
    <!-- Alis & Mata Tajam Bertekad -->
    <path d="M65 95 L 95 105" stroke="#000" stroke-width="4" stroke-linecap="round" />
    <path d="M145 105 L 175 95" stroke="#000" stroke-width="4" stroke-linecap="round" />
    <ellipse cx="80" cy="115" rx="14" ry="9" fill="#fff" stroke="#000" stroke-width="3" />
    <ellipse cx="160" cy="115" rx="14" ry="9" fill="#fff" stroke="#000" stroke-width="3" />
    <circle cx="82" cy="115" r="5" fill="#0284c7" />
    <circle cx="158" cy="115" r="5" fill="#0284c7" />
    <circle cx="84" cy="113" r="2" fill="#fff" />
    <circle cx="160" cy="113" r="2" fill="#fff" />
    <!-- Hidung & Garis Wajah -->
    <path d="M120 115 L 115 140 L 128 140" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" />
    <!-- Mulut Berbicara Tegas -->
    <path d="M100 165 Q 120 178 140 165" stroke="#000" stroke-width="3.5" fill="#b91c1c" />
  </g>
  ` : `
  <!-- Tokoh Komik Berdiri Gagah di Arena Aksi -->
  <g transform="translate(${isDuo ? '160' : '250'}, 130)" filter="url(#comicGlow${panelNumber})">
    <ellipse cx="50" cy="230" rx="60" ry="12" fill="#000" opacity="0.45" />
    <!-- Jubah Mengibar -->
    <path d="M15 80 Q -10 150 0 220 Q 30 205 50 195 Q 70 205 100 220 Q 110 150 85 80 Z" fill="#b91c1c" stroke="#000" stroke-width="3.5" />
    <!-- Tubuh Armor Komik -->
    <path d="M30 70 L 70 70 L 64 160 L 36 160 Z" fill="#1e3a8a" stroke="#000" stroke-width="3.5" />
    <!-- Tangan Menunjuk Aksi -->
    <path d="M30 75 L 2 110 L 10 120 L 34 85 Z" fill="#1e3a8a" stroke="#000" stroke-width="3" />
    <path d="M70 75 L 98 110 L 90 120 L 66 85 Z" fill="#1e3a8a" stroke="#000" stroke-width="3" />
    <!-- Kepala & Topeng Hero -->
    <circle cx="50" cy="45" r="20" fill="#fed7aa" stroke="#000" stroke-width="3.5" />
    <path d="M30 38 Q 50 20 70 38 Q 60 12 48 14 Q 38 16 30 38 Z" fill="#172554" stroke="#000" stroke-width="2.5" />
    <!-- Topeng / Kacamata Komik -->
    <ellipse cx="43" cy="45" rx="4" ry="3" fill="#fff" stroke="#000" stroke-width="1.5" />
    <ellipse cx="57" cy="45" rx="4" ry="3" fill="#fff" stroke="#000" stroke-width="1.5" />
  </g>
  ${isDuo ? `
  <!-- Tokoh Kedua / Rekan Bertatapan (Panel 4) -->
  <g transform="translate(370, 145)" filter="url(#comicGlow${panelNumber})">
    <ellipse cx="40" cy="215" rx="45" ry="10" fill="#000" opacity="0.45" />
    <path d="M25 65 L 55 65 L 50 150 L 30 150 Z" fill="#047857" stroke="#000" stroke-width="3" />
    <circle cx="40" cy="42" r="18" fill="#fde047" stroke="#000" stroke-width="3" />
    <path d="M22 34 Q 40 18 58 34" stroke="#000" stroke-width="3" fill="none" />
  </g>
  ` : ''}
  `}

  <!-- Badge Label Panel Komik Nyata AI -->
  <g transform="translate(20, 20)">
    <rect width="260" height="28" rx="4" fill="#000000" stroke="#facc15" stroke-width="2" />
    <text x="12" y="19" fill="#fde047" font-family="Impact, Arial Black, sans-serif" font-size="12" letter-spacing="1">
      ⚡ ILUSTRASI AI REALITAS: PANEL ${panelNumber}
    </text>
  </g>

  <!-- Pita Sinopsis Adegan Bawah -->
  <g transform="translate(20, 355)">
    <rect width="560" height="30" rx="3" fill="#fef08a" stroke="#000000" stroke-width="2.5" />
    <text x="14" y="20" fill="#000000" font-family="system-ui, sans-serif" font-size="10" font-weight="900">
      NASKAHPANEL: ${safeScene.slice(0, 68)}
    </text>
  </g>

  <!-- Bingkai Komik Tebal Klasik -->
  <rect x="3" y="3" width="594" height="394" fill="none" stroke="#000000" stroke-width="6" />
</svg>`;
}

app.post('/api/generate-image', async (req, res) => {
  const apiKey = resolveApiKey(req);
  const { 
    prompt, 
    sceneDescription = '', 
    characterBible = null,
    panelNumber = 1,
    pageNumber = 1,
    theme = 'action'
  } = req.body;

  const charDetails = characterBible?.protagonistAppearance 
    ? `Featuring character: ${characterBible.protagonistName || 'hero'} (${characterBible.protagonistAppearance}).`
    : '';

  const sceneText = prompt || sceneDescription || 'Dramatic comic hero in action';

  // 1. TAHAP 1: Coba Google Imagen 3 (Bagi Pengguna dengan Billing Aktif / Paid Tier di Google Cloud)
  if (apiKey) {
    try {
      const comicPrompt = `Vintage 80s comic book page panel illustration, bold ink lines, pop-art halftone dots, dramatic cinematic lighting, vibrant saturated colors, masterpiece. Scene: ${sceneText}. ${charDetails}`;
      
      const imagenUrls = [
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`
      ];

      for (const url of imagenUrls) {
        try {
          const imgResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: comicPrompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: "4:3",
                outputMimeType: "image/jpeg"
              }
            })
          });

          const imgData = await imgResponse.json();
          if (imgResponse.ok && imgData.predictions?.[0]?.bytesBase64Encoded) {
            const b64 = imgData.predictions[0].bytesBase64Encoded;
            const finalImgUrl = `data:image/jpeg;base64,${b64}`;

            // Simpan ke fallbackStore agar gambar panel persisten
            const targetM = fallbackStore.manifestations.find(m => Number(m.pageNumber) === Number(pageNumber));
            if (targetM) {
              targetM[`panelImage_${panelNumber}`] = finalImgUrl;
              if (targetM.comicPanels?.[panelNumber - 1]) {
                targetM.comicPanels[panelNumber - 1].aiImageUrl = finalImgUrl;
              }
            }

            return res.json({
              success: true,
              imageUrl: finalImgUrl,
              source: 'Google Imagen 3 (Official)',
              panelNumber,
              pageNumber
            });
          }
        } catch (innerErr) {
          // Lanjut ke endpoint atau fallback berikutnya
        }
      }
    } catch (e) {
      console.warn('[Imagen 3 Predict Skipped/Failed]', e.message);
    }
  }

  // 2. TAHAP 2: Gemini AI Comic Illustration Engine (Solusi Utama untuk Free-Tier Google AI Studio)
  // Gemini text model (seperti gemini-1.5-flash / gemini-2.0-flash) 100% aktif dan dapat merender seni SVG komik kustom
  if (apiKey) {
    try {
      const activeModel = (systemAiConfig.selectedModel || 'gemini-1.5-flash').replace('models/', '');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

      const geminiPrompt = `You are a legendary Master Comic Book Illustrator specializing in 1980s vintage retro pop-art graphic novels (bold ink lines, cinematic lighting, vibrant saturated colors).
Generate an intricate, colorful, complete SVG illustration for a single comic book panel.
Panel Details:
- Scene: "${sceneText}"
- Theme: "${theme}"
- Character: "${characterBible?.protagonistName || 'Hero'} (${characterBible?.protagonistAppearance || 'Comic protagonist in iconic costume'})"

STRICT RULES:
1. Provide a single self-contained <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">...</svg>.
2. Include rich backgrounds (urban towers, celestial skies, interior lights), dynamic character silhouettes/figures, speed lines, comic gradients, and bold black borders.
3. OUTPUT FORMAT: Output ONLY the raw <svg>...</svg> code. Do NOT wrap in markdown backticks (no \`\`\`xml or \`\`\`svg), do NOT add introductory or conversational text.`;

      const gRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      const gData = await gRes.json();
      const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Bersihkan teks SVG dari markdown backticks jika ada
      let cleanSvg = rawText
        .replace(/^```(xml|svg)?/gi, '')
        .replace(/```$/gi, '')
        .trim();

      const svgStart = cleanSvg.indexOf('<svg');
      const svgEnd = cleanSvg.lastIndexOf('</svg>');

      if (svgStart !== -1 && svgEnd !== -1) {
        cleanSvg = cleanSvg.slice(svgStart, svgEnd + 6);
        const b64 = Buffer.from(cleanSvg).toString('base64');
        const finalImgUrl = `data:image/svg+xml;base64,${b64}`;

        const targetM = fallbackStore.manifestations.find(m => Number(m.pageNumber) === Number(pageNumber));
        if (targetM) {
          targetM[`panelImage_${panelNumber}`] = finalImgUrl;
          if (targetM.comicPanels?.[panelNumber - 1]) {
            targetM.comicPanels[panelNumber - 1].aiImageUrl = finalImgUrl;
          }
        }

        return res.json({
          success: true,
          imageUrl: finalImgUrl,
          source: 'Gemini AI Comic Illustration Engine',
          panelNumber,
          pageNumber
        });
      }
    } catch (geminiErr) {
      console.warn('[Gemini Comic Engine Skipped/Failed]', geminiErr.message);
    }
  }

  // 3. TAHAP 3: Vintage Comic Engine Procedural (Jaminan Anti-Error 100%)
  // Jika kuota habis atau offline, selalu kembalikan visual komik retro resolusi tinggi yang indah
  const fallbackSvg = generateVintageComicSvg(sceneText, theme, characterBible, panelNumber);
  const b64 = Buffer.from(fallbackSvg).toString('base64');
  const finalImgUrl = `data:image/svg+xml;base64,${b64}`;

  const targetM = fallbackStore.manifestations.find(m => Number(m.pageNumber) === Number(pageNumber));
  if (targetM) {
    targetM[`panelImage_${panelNumber}`] = finalImgUrl;
    if (targetM.comicPanels?.[panelNumber - 1]) {
      targetM.comicPanels[panelNumber - 1].aiImageUrl = finalImgUrl;
    }
  }

  return res.json({
    success: true,
    imageUrl: finalImgUrl,
    source: 'Mythoria Retro Comic Artist Engine',
    panelNumber,
    pageNumber
  });
});

// ----------------------------------------------------
// 5. PEMANGGILAN KARAKTER SINEMA JADUL
// ----------------------------------------------------
app.post('/api/summon', async (req, res) => {
  const apiKey = resolveApiKey(req);
  const activeModel = req.body?.model || systemAiConfig.selectedModel || 'gemini-1.5-flash';
  const { characterType, sessionId = 'default-session', pageNumber = 1 } = req.body;

  const archetypeProfiles = {
    noir: {
      name: 'Detektif Noir Sinis',
      archetype: '1940s Hardboiled Detective',
      defaultQuote: 'Kota ini membusuk, tapi jejak sepatu di aspal basah ini masih baru.',
      skill: 'Menganalisis petunjuk tersembunyi dan jejak kaki rahasia.',
      sfx: 'CLICK-CLACK!'
    },
    wizard: {
      name: 'Penyihir Eksentrik 80-an',
      archetype: '1980s Dark Fantasy Sorcerer',
      defaultQuote: 'Gulungan ini berbisik dalam lidah bintang kuno yang tak boleh kau sebut!',
      skill: 'Menerjemahkan inskripsi kuno dan menguraikan kutukan.',
      sfx: 'ZAAAAP!'
    },
    golem: {
      name: 'Clay Stop-Motion Golem',
      archetype: 'Ray Harryhausen Classic Creature',
      defaultQuote: '(Geraman berat tanah liat bergetar pada 12 bingkai per detik)',
      skill: 'Menghancurkan rintangan fisik tebal dengan kekuatan kinetik.',
      sfx: 'THUD-CRUNCH!'
    }
  };

  const profile = archetypeProfiles[characterType] || archetypeProfiles.noir;
  let aiDialogue = profile.defaultQuote;
  let aiVisual = `Karakter melangkah keluar dari halaman buku, terbungkus efek strip seluloid film.`;

  if (apiKey) {
    try {
      const prompt = `
Karakter ${profile.name} (${profile.archetype}) dipanggil ke dunia nyata melalui Buku Realitas Mythoria pada Halaman ${pageNumber}.
Berikan satu dialog khas gaya komik jadul dan deskripsi visual panel kemunculannya.
Format JSON:
{
  "dialogue": "Dialog khas karakter (maks 15 kata)",
  "visualScene": "Pose dramatis panel komik (maks 25 kata)",
  "soundEffect": "SFX kemunculan (contoh: ${profile.sfx})"
}
      `;
      const result = await callGemini(apiKey, activeModel, prompt);
      if (result.dialogue) aiDialogue = result.dialogue;
      if (result.visualScene) aiVisual = result.visualScene;
    } catch (err) {
      if (err.isQuota || err.message === 'QUOTA_EXCEEDED') {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: 'Batas kuota token AI Google Studio telah habis (Limit). Silakan hubungi Administrator sistem!'
        });
      }
      console.warn('[Gemini Summon Failed, fallback used]', err.message);
    }
  }

  const { pool, isConnected } = getDb();
  let charId = Date.now();

  if (isConnected && pool) {
    try {
      const [insertRes] = await pool.query(
        `INSERT INTO characters (session_id, name, archetype, dialogue, special_skill) VALUES (?, ?, ?, ?, ?)`,
        [sessionId, profile.name, profile.archetype, aiDialogue, profile.skill]
      );
      charId = insertRes.insertId;
    } catch (err) {
      console.error('[DB Insert Char Error]', err);
    }
  }

  const charData = {
    id: charId,
    sessionId,
    pageNumber: parseInt(pageNumber, 10) || 1,
    name: profile.name,
    archetype: profile.archetype,
    dialogue: aiDialogue,
    specialSkill: profile.skill,
    visualScene: aiVisual,
    soundEffect: profile.sfx,
    createdAt: new Date().toISOString()
  };
  fallbackStore.characters.unshift(charData);

  res.json({
    success: true,
    data: charData
  });
});

// ----------------------------------------------------
// 6. CORET NASKAH (REDACT)
// ----------------------------------------------------
app.post('/api/redact', async (req, res) => {
  const { manifestationId, sessionId = 'default-session', pageNumber } = req.body;

  const target = fallbackStore.manifestations.find(m => String(m.id) === String(manifestationId));
  const resolvedPageNum = parseInt(pageNumber, 10) || target?.pageNumber || 1;
  const glitchDesc = `Robekan realitas terjadi di Halaman ${resolvedPageNum} pada naskah #${manifestationId}. Desisan reel proyektor 35mm berdengung kencang, meninggalkan retakan ruang!`;

  const { pool, isConnected } = getDb();
  if (isConnected && pool && manifestationId) {
    try {
      await pool.query(`UPDATE manifestations SET is_redacted = 1 WHERE id = ?`, [manifestationId]);
      await pool.query(
        `INSERT INTO reality_scars (session_id, glitch_description) VALUES (?, ?)`,
        [sessionId, glitchDesc]
      );
    } catch (err) {
      console.error('[DB Redact Error]', err);
    }
  }

  if (target) {
    target.isRedacted = true;
  }
  fallbackStore.realityScars.unshift({
    id: Date.now(),
    sessionId,
    pageNumber: resolvedPageNum,
    description: glitchDesc,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    glitchDescription: glitchDesc,
    stabilityLoss: 20
  });
});

// ----------------------------------------------------
// 7. AMBIL DATA SESI
// ----------------------------------------------------
app.get('/api/session/:id', async (req, res) => {
  const sessionId = req.params.id;
  const { pool, isConnected } = getDb();

  if (isConnected && pool) {
    try {
      const [sessions] = await pool.query(`SELECT * FROM game_sessions WHERE id = ?`, [sessionId]);
      const [pages] = await pool.query(
        `SELECT id, session_id as sessionId, page_number as pageNumber, title, summary FROM book_pages WHERE session_id = ? ORDER BY page_number ASC`,
        [sessionId]
      );
      const [manifestations] = await pool.query(
        `SELECT * FROM manifestations WHERE session_id = ? ORDER BY id DESC LIMIT 50`,
        [sessionId]
      );
      const [characters] = await pool.query(
        `SELECT * FROM characters WHERE session_id = ? ORDER BY id DESC LIMIT 10`,
        [sessionId]
      );
      const [scars] = await pool.query(
        `SELECT * FROM reality_scars WHERE session_id = ? ORDER BY id DESC LIMIT 10`,
        [sessionId]
      );

      return res.json({
        session: sessions[0] || { id: sessionId, stability: 100, ink_jelaga: 15, ink_gold: 5, ink_blood: 2 },
        pages: pages.length > 0 ? pages : [{ id: 1, sessionId, pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }],
        manifestations,
        characters,
        realityScars: scars,
        isDatabaseActive: true
      });
    } catch (err) {
      console.error('[DB Fetch Error]', err);
    }
  }

  const sPages = fallbackStore.pages.filter(p => p.sessionId === sessionId);
  res.json({
    session: { id: sessionId, stability: 100, ink_jelaga: 15, ink_gold: 5, ink_blood: 2 },
    pages: sPages.length > 0 ? sPages : [{ id: 1, sessionId, pageNumber: 1, title: 'Halaman 1: Awal Mula Naskah' }],
    manifestations: fallbackStore.manifestations,
    characters: fallbackStore.characters,
    realityScars: fallbackStore.realityScars,
    isDatabaseActive: false
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Mythoria Server] Berjalan di http://localhost:${PORT}`);
  });
}

export default app;
