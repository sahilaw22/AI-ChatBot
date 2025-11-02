// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Configuration from .env
// -------------------------
const PORT = process.env.PORT || 4000 ;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme_admin_token';

// -------------------------
// CORS setup
// -------------------------
app.use(cors({
  origin: (origin, cb) => {
    console.log('🛰️ Incoming Origin:', origin);
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5500' // ✅ Live Server origin
    ];
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(null, true); // dev fallback
  }
}));

// -------------------------
// Ensure upload dir exists
// -------------------------
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// -------------------------
// Multer setup
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// -------------------------
// SQLite setup
// -------------------------
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'gcet.sqlite3');
const db = new sqlite3.Database(DB_PATH);
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (err) { if (err) rej(err); else res(this); }));
const dbGet = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));

// -------------------------
// Init DB tables
// -------------------------
async function initDb() {
  await dbRun(`CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, branch TEXT, semester INTEGER, batch TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await dbRun(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, role TEXT, content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await dbRun(`CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, original_name TEXT, file_url TEXT, semester INTEGER, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await dbRun(`CREATE TABLE IF NOT EXISTS faq (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer TEXT)`);
  await dbRun(`CREATE TABLE IF NOT EXISTS timetables (id INTEGER PRIMARY KEY AUTOINCREMENT, branch TEXT, semester INTEGER, batch TEXT, payload TEXT)`);
  await dbRun(`CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, branch TEXT, semester INTEGER, batch TEXT, payload TEXT)`);
}
initDb().catch(console.error);

app.use('/uploads', express.static(UPLOAD_DIR));

// -------------------------
// Helper functions
// -------------------------
function nowIso() {
  return (new Date()).toISOString();
}

// ✅ Updated Gemini helper
async function callGeminiChat(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  console.log("💬 Calling Gemini with prompt:", prompt);
  console.log("➡️ Attempting to fetch from Gemini API...");

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  // Create an AbortController to handle timeouts manually
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal // Associate the signal with the fetch request
    });

    clearTimeout(id); // Clear the timeout if fetch completes successfully

    console.log(`✅ Received response from Gemini with status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log("📦 Parsed Gemini data:", JSON.stringify(data, null, 2));
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No valid response.';
    console.log("💡 Extracted Gemini reply:", reply);

    return reply.trim();
  } catch (networkError) {
    clearTimeout(id); // Ensure timeout is cleared even on error
    if (networkError.name === 'AbortError') {
      console.error("❌ Gemini API request timed out after 10 seconds.");
    } else {
      console.error("❌ Network or fetch error connecting to Gemini:", networkError);
    }
    throw networkError;
  }
}


// -------------------------
// API Endpoints
// -------------------------
app.get('/api/health', (req, res) => res.json({ ok: true, now: nowIso() }));

app.post('/api/query', async (req, res) => {
  try {
    const { text = '', context = {}, userId = 'guest' } = req.body;
    const lower = text.toLowerCase();

    await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)`, [userId, text]);

    // Timetable / Exams logic
    if (lower.includes('timetable') || lower.includes('schedule')) {
      const branch = context.branch || 'CSE';
      const semester = context.semester || 1;
      const batch = context.batch || '2025';
      const row = await dbGet(`SELECT payload FROM timetables WHERE branch = ? AND semester = ? AND batch = ?`, [branch, semester, batch]);
      if (row && row.payload) {
        const data = JSON.parse(row.payload);
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, `Found timetable for ${branch} Sem ${semester}`]);
        return res.json({ ok: true, type: 'timetable', data });
      }
    }

    // ✅ Gemini fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiResp = await callGeminiChat(text);
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, aiResp]);
        return res.json({ ok: true, message: aiResp, type: 'text' });
      } catch (err) {
        console.error('Gemini call failed:', err);
        const fallback = "Sorry, the AI service is unavailable right now.";
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, fallback]);
        return res.json({ ok: true, message: fallback });
      }
    } else {
      const help = "AI is not configured. Add GEMINI_API_KEY in backend .env file.";
      await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, help]);
      return res.json({ ok: true, message: help });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// -------------------------
// Start server
// -------------------------
app.listen(PORT, () => {
  console.log(`✅ GCET backend listening on http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
  if (!process.env.GEMINI_API_KEY) console.log('⚠️  Gemini not configured. Set GEMINI_API_KEY in .env to enable AI.');
});
