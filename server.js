import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDatabase, getDb, fallbackStore, dbConfig, DEFAULT_USERS } from './db.js';

dotenv.config();

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

    const usableModels = (data.models || [])
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
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

// Generator Cerita Cerdas untuk Fallback (Jika API Key belum dimasukkan)
function generateIntelligentStoryFallback(sentence, pageNumber, storyHistory) {
  const lower = sentence.toLowerCase();

  // 1. TEMA: PENEMUAN PROFESOR & PESAWAT BAJAJ (SESUAI GAMBAR KOMIK REFERENSI)
  if (lower.includes('pesawat') || lower.includes('bajaj') || lower.includes('profesor') || lower.includes('ayah') || lower.includes('bum') || lower.includes('ammar') || lower.includes('spanyol') || lower.includes('madrid') || lower.includes('terbang') || lower.includes('ciptaan') || lower.includes('mesin') || lower.includes('laboratorium') || lower.includes('kuning')) {
    return {
      theme: 'retro_invention',
      comicCaption: `PENEMUAN SPEKTAKULER: PESAWAT BAJAJ SIAP MENEMBUS ANGKASA!`,
      soundEffect: `DDD ... DDTT ....`,
      visualScene: `Profesor dengan jas lab putih dan kacamata bulat bangga memamerkan pesawat bajaj kuning bersayap kepada Bum yang heran di laboratorium.`,
      storyOutcome: `Mesin pesawat bajaj kuning menderu kencang membelah landasan dengan getaran hebat. Balon ucapan dan garis gerak mengabarkan rencana penerbangan melintasi samudra menuju Madrid.`,
      panelDialogue: `"Bagaimana, Bum? Pesawat buatan ayah keren sekali, bukan?"`,
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'vehicle_intro',
          sfx: 'DDD ... DDTT ....',
          sfxSecondary: 'BIP BIP ....',
          dialogues: [
            { speaker: 'Profesor', text: 'BAGAIMANA, BUM? PESAWAT BUATAN AYAH KEREN SEKALI, BUKAN?', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'lab_banter',
          dialogues: [
            { speaker: 'Bum', text: 'AH, BIASA SAJA, YAH. APANYA YANG KEREN? MALAH MIRIP BAJAJ BEGITU.', tail: 'right', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'mid_right',
          scene: 'tablet_plan',
          dialogues: [
            { speaker: 'Profesor', text: 'BAGAIMANA KALAU KAMU UJI COBA PESAWAT INI BERSAMA KAK AMMAR?', tail: 'left', bubbleType: 'speech' },
            { speaker: 'Bum', text: 'APA? ENGGAK MAU, AH! PALING JUGA GAGAL LAGI.', tail: 'right', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 4,
          panelType: 'bottom_left',
          scene: 'cockpit_reassure',
          dialogues: [
            { speaker: 'Profesor', text: 'KALI INI PASTI BERHASIL, PERCAYA SAMA AYAH! LAGI PULA, APA KAMU TIDAK INGIN TERBANG KE SPANYOL? MELIHAT STADION SANTIAGO BERNABEU DI KOTA MADRID?', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 5,
          panelType: 'bottom_right',
          scene: 'boy_shock',
          dialogues: [
            { speaker: 'Bum', text: 'KE STADION SANTIAGO BERNABEU?', tail: 'center', bubbleType: 'thought' }
          ]
        }
      ]
    };
  }

  // 2. TEMA: PROYEKTOR FILM 35MM & PENGEJAR
  if (lower.includes('proyektor') || lower.includes('menelan') || lower.includes('pengejar') || lower.includes('35mm')) {
    return {
      theme: 'projector',
      comicCaption: `SOROTAN SELULOID MEMADAT: PARA PENGEJAR TERTELAN LENSA!`,
      soundEffect: `WHIRRRR-KLAKKK!`,
      visualScene: `Berkas cahaya perak dari proyektor 35mm seketika memadat menjadi pusaran seluloid cair. Siluet para pengejar tertarik ke udara, tubuh mereka terurai menjadi ribuan bingkai film hitam-putih yang berputar cepat!`,
      storyOutcome: `Proyektor 35mm berputar dengan raungan bising di sudut ruangan. Para pengejar terperangkap di dalam gulungan pita seluloid film, menyisakan ruangan yang kembali sunyi dan jalan keluar yang kini terbuka bebas.`,
      panelDialogue: `"Mereka telah terkurung di dalam gulungan film... jangan berhenti berlari!"`,
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'projector_beam',
          sfx: 'WHIRRRR-KLAKKK!',
          dialogues: [
            { speaker: 'Penulis', text: 'REALITAS TUNDUK PADA NASKAH: PROYEKTOR 35MM BERPUTAR MENGURAI REALITAS!', tail: 'left', bubbleType: 'narration' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'projector_trap',
          sfx: 'KRAAAK!',
          dialogues: [
            { speaker: 'Pengejar', text: 'TIDAK! CAHAYA INI MENARIK KITA KE DALAM SELULOID!', tail: 'right', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'bottom_left',
          scene: 'projector_escape',
          dialogues: [
            { speaker: 'Tokoh Utama', text: 'MEREKA TELAH TERKURUNG DI GULUNGAN FILM... JANGAN BERHENTI BERLARI!', tail: 'left', bubbleType: 'speech' }
          ]
        }
      ]
    };
  }

  // 3. TEMA: DETEKTIF NOIR & JALAN GELAP
  if (lower.includes('detektif') || lower.includes('kabut') || lower.includes('gelap') || lower.includes('hujan') || lower.includes('malam') || lower.includes('noir')) {
    return {
      theme: 'noir',
      comicCaption: `KABUT PEKAT MEMBELAH REALITAS FILM NOIR!`,
      soundEffect: `SHSHSHSHHH!`,
      visualScene: `Asap kabut tebal bergulung dari celah lantai kayu, menutupi seluruh pandangan dan menelan siluet siapa pun yang mendekat ke dalam kehampaan dingin.`,
      storyOutcome: `Dinding ruangan menghilang ditelan kabut pekat bernuansa film noir. Suara langkah kaki musuh terdengar bingung berputar-putar di tempat tanpa bisa melihat arah.`,
      panelDialogue: `"Kabut ini bukan kabut biasa... ia menyembunyikan kita dari mata mereka."`,
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'noir_street',
          sfx: 'DRIP... DRIP...',
          dialogues: [
            { speaker: 'Detektif', text: 'KOTA INI MENYIMPAN RAHASIA GELAP... DAN NASKAH INI MULAI TERBUKTI.', tail: 'left', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'noir_fog',
          dialogues: [
            { speaker: 'Saksi', text: 'SIAPA KAU? APA YANG KAU KETAHUI TENTANG BUKU ITU?', tail: 'right', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'bottom_left',
          scene: 'noir_clue',
          sfx: 'KLIK-KLAK!',
          dialogues: [
            { speaker: 'Detektif', text: 'KAU AKAN MELIHATNYA SENDIRI DI BALIK KABUT INI.', tail: 'left', bubbleType: 'speech' }
          ]
        }
      ]
    };
  }

  // 4. TEMA: PENYIHIR & SIHIR
  if (lower.includes('penyihir') || lower.includes('sihir') || lower.includes('mantra') || lower.includes('lentera') || lower.includes('api')) {
    return {
      theme: 'wizard',
      comicCaption: `API ZAMRUD MEMBAKAR KEGELAPAN DIMENSI!`,
      soundEffect: `FZZZZT-BLAZE!`,
      visualScene: `Lentera tua meletup dengan pijaran api hijau zamrud mistis, memancarkan bayangan raksasa di dinding batu yang bergerak sendiri menari mengikuti naskah.`,
      storyOutcome: `Pijaran api zamrud menyingkap pintu rahasia di balik rak buku kuno yang sebelumnya terkunci rapat oleh kutukan waktu.`,
      panelDialogue: `"Cahaya ini menunjukkan lorong rahasia yang tertulis dalam ramalan!"`,
      comicPanels: [
        {
          panelNumber: 1,
          panelType: 'wide_top',
          scene: 'wizard_cast',
          sfx: 'FZZZZT-BLAZE!',
          dialogues: [
            { speaker: 'Penyihir', text: 'DENGAN KEKUATAN TINTA KUNO, GERBANG ARCANE TERBUKA!', tail: 'left', bubbleType: 'shout' }
          ]
        },
        {
          panelNumber: 2,
          panelType: 'mid_left',
          scene: 'wizard_portal',
          dialogues: [
            { speaker: 'Murid', text: 'LIHAT! RUANG DAN WAKTU MULAI MELENGKUNG!', tail: 'right', bubbleType: 'speech' }
          ]
        },
        {
          panelNumber: 3,
          panelType: 'bottom_left',
          scene: 'wizard_destiny',
          dialogues: [
            { speaker: 'Penyihir', text: 'MASUKLAH SEBELUM KESTABILAN REALITAS HANCUR!', tail: 'left', bubbleType: 'speech' }
          ]
        }
      ]
    };
  }

  // 5. DEFAULT / PROSEDURAL KREATIF UNTUK TEKS APA PUN
  const words = sentence.split(' ');
  const displaySubject = words.slice(0, 3).join(' ') || 'Tokoh Utama';
  const displayAction = words.slice(3).join(' ') || 'mewujudkan takdir naskah';

  return {
    theme: 'action',
    comicCaption: `REALITAS TUNDUK PADA NASKAH HALAMAN ${pageNumber}!`,
    soundEffect: `KRAAK-WHOOSH!`,
    visualScene: `Ruang di sekitar bergetar seperti strip film seluloid yang terbakar panas. Peristiwa "${sentence}" terukir secara fisik ke dalam dunia nyata dengan partikel cahaya emas.`,
    storyOutcome: `Kata-kata yang tertulis di buku menjelma menjadi fenomena fisik nyata di hadapan mata. Hukum alam melengkung mengikuti kehendak sang penulis naskah.`,
    panelDialogue: `"Setiap huruf yang kau goreskan... benar-benar mengubah kenyataan!"`,
    comicPanels: [
      {
        panelNumber: 1,
        panelType: 'wide_top',
        scene: 'custom_wide',
        sfx: 'KRAAK-WHOOSH!',
        dialogues: [
          { speaker: displaySubject, text: `${sentence.toUpperCase()}!`, tail: 'left', bubbleType: 'shout' }
        ]
      },
      {
        panelNumber: 2,
        panelType: 'mid_left',
        scene: 'custom_dialogue',
        dialogues: [
          { speaker: 'Saksi', text: `BAGAIMANA BISA HAL INI TERJADI BEGITU SAJA?!`, tail: 'right', bubbleType: 'speech' },
          { speaker: displaySubject, text: `KARENA NASKAH TELAH MENULISKANNYA KE DALAM REALITAS!`, tail: 'left', bubbleType: 'speech' }
        ]
      },
      {
        panelNumber: 3,
        panelType: 'bottom_left',
        scene: 'custom_climax',
        sfx: 'BLAMMM!',
        dialogues: [
          { speaker: 'Narator', text: `DAN DENGAN DEMIKIAN, TAKDIR HALAMAN INI TELAH TERKUNCI.`, tail: 'center', bubbleType: 'thought' }
        ]
      }
    ]
  };
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
    storyHistory = '' 
  } = req.body;

  if (!sentence || !sentence.trim()) {
    return res.status(400).json({ error: 'Naskah kalimat manifestasi tidak boleh kosong.' });
  }

  let aiResult = null;
  if (apiKey) {
    try {
      const prompt = `
Anda adalah Sutradara Komik Klasik Retro (Retro Sci-Fi, Noir, Pulp Fantasy, Vintage Cinema) untuk sistem Mythoria.

KONTEKS / PERISTIWA SEBELUMNYA (HARUS NYAMBUNG SECARA LOGIS):
${storyHistory ? `"${storyHistory}"` : "(Ini adalah panel awal pembuka cerita.)"}

SEKARANG, DI HALAMAN ${pageNumber}, PENULIS MENULISKAN NASKAH BERIKUT:
"${sentence}"

Jenis Tinta: "${inkType}" (jelaga = sementara, emas = permanen agung, darah = berbahaya/tidak stabil)

INSTRUKSI SUTRADARA KOMIK:
1. Sambungkan adegan ini secara RUNTUT dan SINEMATIK dengan kejadian sebelumnya di atas!
2. Jika naskah kurang detail atau singkat, proseslah dan kembangkanlah sepengetahuan Anda menjadi adegan komik multi-panel yang seru dan hidup!
3. Berikan respon JSON valid dengan format:
{
  "theme": "retro_invention | projector | noir | wizard | action",
  "comicCaption": "Teks narasi di kotak komik huruf kapital tebal (maks 15 kata)",
  "soundEffect": "Efek suara komik dramatis (contoh: DDD ... DDTT .... / WHIRRR! / KRAK!)",
  "visualScene": "Deskripsi detail komposisi visual panel komik yang dramatis (maks 35 kata)",
  "storyOutcome": "Konsekuensi nyata di dunia yang terjadi secara fisik dan menjelaskan secara gamblang apa yang terjadi (maks 40 kata)",
  "panelDialogue": "Satu kutipan dialog karakter utama atau seruan di tempat kejadian (maks 20 kata)",
  "comicPanels": [
    {
      "panelNumber": 1,
      "panelType": "wide_top",
      "scene": "scene_identifier",
      "sfx": "DDD ... DDTT ....",
      "dialogues": [
        { "speaker": "Nama Tokoh", "text": "Kutipan dialog komik huruf kapital tebal!", "tail": "left", "bubbleType": "speech" }
      ]
    },
    {
      "panelNumber": 2,
      "panelType": "mid_left",
      "scene": "scene_identifier",
      "dialogues": [
        { "speaker": "Tokoh Kedua", "text": "Tanggapan atau reaksi skeptis!", "tail": "right", "bubbleType": "speech" }
      ]
    },
    {
      "panelNumber": 3,
      "panelType": "bottom_left",
      "scene": "scene_identifier",
      "sfx": "KLIK!",
      "dialogues": [
        { "speaker": "Tokoh Utama", "text": "Pernyataan tekad atau kejutan!", "tail": "center", "bubbleType": "thought" }
      ]
    }
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
    aiResult = generateIntelligentStoryFallback(sentence, pageNumber, storyHistory);
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
    aiStory: aiResult.storyOutcome,
    comicCaption: aiResult.comicCaption,
    soundEffect: aiResult.soundEffect,
    visualScene: aiResult.visualScene,
    panelDialogue: aiResult.panelDialogue,
    comicPanels: aiResult.comicPanels || [],
    theme: aiResult.theme || 'retro_invention',
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
