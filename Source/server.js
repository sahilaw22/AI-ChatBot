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
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database:', DB_PATH);
});

const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (err) { if (err) rej(err); else res(this); }));
const dbGet = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));

// -------------------------
// Init DB tables
// -------------------------
async function initDb() {
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, branch TEXT, semester INTEGER, batch TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    await dbRun(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, role TEXT, content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    await dbRun(`CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, original_name TEXT, file_url TEXT, semester INTEGER, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    await dbRun(`CREATE TABLE IF NOT EXISTS faq (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer TEXT)`);
    await dbRun(`CREATE TABLE IF NOT EXISTS timetables (id INTEGER PRIMARY KEY AUTOINCREMENT, branch TEXT, semester INTEGER, batch TEXT, payload TEXT)`);
    await dbRun(`CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY AUTOINCREMENT, branch TEXT, semester INTEGER, batch TEXT, payload TEXT)`);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  }
}
initDb();

app.use('/uploads', express.static(UPLOAD_DIR));

// -------------------------
// Helper functions
// -------------------------
function nowIso() {
  return (new Date()).toISOString();
}

// ✅ Build system prompt with context
function buildSystemPrompt(userContext) {
  const { branch = 'Not specified', semester = 'Not specified', batch = 'Not specified', userName = 'Student' } = userContext;
  
  return `You are GCET Jammu Assistant - helpful buddy for students.

Student: ${userName} | ${branch} | Sem ${semester} | Batch ${batch}

GCET = Govt college in Chak Bhalwal, Jammu (J&K)
Branches: CSE, ECE, ME, CE, EE
Admission: JEE Main & JKCET

HOW TO TALK:
- Short answers (2-3 sentences)
- Talk like a human, not a robot
- Use simple, easy words
- 1 emoji max 😊
- Add blank lines between ideas

EXAMPLES:
Bad: "I am delighted to provide information..."
Good: "Sure! Here's what you need..."

Bad: Long paragraphs
Good: Short lines with spaces

FORMAT:
Hey! 👋

Quick answer here.

Extra details if needed.

Want to know more?

Now respond:`;
}

// ✅ Enhanced Gemini helper with conversation history
async function callGeminiChat(userMessage, userContext = {}, conversationHistory = []) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  console.log("💬 Calling Gemini with message:", userMessage);
  console.log("➡️ Attempting to fetch from Gemini API...");

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  // Build the full prompt with system context
  const systemPrompt = buildSystemPrompt(userContext);
  
  // Combine system prompt with conversation history
  const contents = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    {
      role: "model",
      parts: [{ text: "I understand. I'm GCET College Assistant, ready to help students with any questions about academics, college life, technical topics, or general conversation. How can I assist you today?" }]
    }
  ];

  // Add recent conversation history (last 5 messages for context)
  const recentHistory = conversationHistory.slice(-5);
  recentHistory.forEach(msg => {
    if (msg.role === 'user') {
      contents.push({
        role: "user",
        parts: [{ text: msg.content }]
      });
    } else if (msg.role === 'bot') {
      contents.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    }
  });

  // Add current user message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  const payload = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  // Create an AbortController to handle timeouts manually
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`✅ Received response from Gemini with status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No valid response.';
    console.log("💡 Extracted Gemini reply:", reply);

    return reply.trim();
  } catch (networkError) {
    clearTimeout(timeoutId);
    if (networkError.name === 'AbortError') {
      console.error("❌ Gemini API request timed out after 15 seconds.");
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
    const lower = text.toLowerCase().trim();

    // Validate input
    if (!text || text.trim() === '') {
      return res.status(400).json({ ok: false, message: 'Message text is required' });
    }

    // Save user message to database
    await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)`, [userId, text]);

    // Get conversation history for context (last 10 messages)
    const history = await dbAll(
      `SELECT role, content FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT 10`,
      [userId]
    );
    const conversationHistory = history.reverse(); // Oldest to newest

    // Check for specific data queries first (timetables, exams)
    if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('class timing')) {
      const branch = context.branch || 'CSE';
      const semester = context.semester || 1;
      const batch = context.batch || '2025';
      const row = await dbGet(
        `SELECT payload FROM timetables WHERE branch = ? AND semester = ? AND batch = ?`,
        [branch, semester, batch]
      );
      
      if (row && row.payload) {
        const data = JSON.parse(row.payload);
        const message = `Here's the timetable for ${branch} Semester ${semester}, Batch ${batch}`;
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, message]);
        return res.json({ ok: true, type: 'timetable', data, message });
      } else {
        // No timetable in DB, let AI handle it
        const aiMessage = `I don't have the specific timetable data for ${branch} Semester ${semester}, Batch ${batch} in my database yet. However, I can help you with general information about schedules or direct you to the college administration for the latest timetable.`;
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, aiMessage]);
        return res.json({ ok: true, message: aiMessage, type: 'text' });
      }
    }

    // Check for exam schedule queries
    if (lower.includes('exam') && (lower.includes('schedule') || lower.includes('date') || lower.includes('timing'))) {
      const branch = context.branch || 'CSE';
      const semester = context.semester || 1;
      const batch = context.batch || '2025';
      const row = await dbGet(
        `SELECT payload FROM exams WHERE branch = ? AND semester = ? AND batch = ?`,
        [branch, semester, batch]
      );
      
      if (row && row.payload) {
        const data = JSON.parse(row.payload);
        const message = `Here's the exam schedule for ${branch} Semester ${semester}, Batch ${batch}`;
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, message]);
        return res.json({ ok: true, type: 'exam', data, message });
      }
    }

    // Check FAQ database for quick answers
    const faqRow = await dbGet(
      `SELECT answer FROM faq WHERE LOWER(question) LIKE ?`,
      [`%${lower}%`]
    );
    
    if (faqRow && faqRow.answer) {
      await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, faqRow.answer]);
      return res.json({ ok: true, message: faqRow.answer, type: 'text', source: 'faq' });
    }

    // ✅ Use enhanced Gemini AI with context and conversation history
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiResp = await callGeminiChat(text, context, conversationHistory);
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, aiResp]);
        return res.json({ ok: true, message: aiResp, type: 'text' });
      } catch (err) {
        console.error('Gemini call failed:', err);
        const fallback = "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment, or feel free to ask a different question! 😊";
        await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, fallback]);
        return res.json({ ok: true, message: fallback, type: 'text' });
      }
    } else {
      const help = "AI is not configured. Please contact the administrator to set up the GEMINI_API_KEY.";
      await dbRun(`INSERT INTO messages (user_id, role, content) VALUES (?, 'bot', ?)`, [userId, help]);
      return res.json({ ok: true, message: help, type: 'text' });
    }

  } catch (err) {
    console.error('Query endpoint error:', err);
    res.status(500).json({ ok: false, message: 'Server error. Please try again later.' });
  }
});

// -------------------------
// Additional Helper Endpoints
// -------------------------

// Get conversation history for a user
app.get('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await dbAll(
      `SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT ?`,
      [userId, limit]
    );
    
    res.json({ ok: true, messages: messages.reverse() });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch history' });
  }
});

// Clear conversation history for a user
app.delete('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await dbRun(`DELETE FROM messages WHERE user_id = ?`, [userId]);
    res.json({ ok: true, message: 'History cleared successfully' });
  } catch (err) {
    console.error('History clear error:', err);
    res.status(500).json({ ok: false, message: 'Failed to clear history' });
  }
});

// Add FAQ (requires admin token)
app.post('/api/admin/faq', async (req, res) => {
  try {
    const { question, answer } = req.body;
    const token = req.headers.authorization || req.query.token;
    
    if (token !== `Bearer ${ADMIN_TOKEN}` && token !== ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
    
    if (!question || !answer) {
      return res.status(400).json({ ok: false, message: 'Question and answer are required' });
    }
    
    await dbRun(`INSERT INTO faq (question, answer) VALUES (?, ?)`, [question, answer]);
    res.json({ ok: true, message: 'FAQ added successfully' });
  } catch (err) {
    console.error('FAQ add error:', err);
    res.status(500).json({ ok: false, message: 'Failed to add FAQ' });
  }
});

// Get all FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    const faqs = await dbAll(`SELECT id, question, answer FROM faq ORDER BY id DESC`);
    res.json({ ok: true, faqs });
  } catch (err) {
    console.error('FAQ fetch error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch FAQs' });
  }
});

// Save user profile/context
app.post('/api/profile', async (req, res) => {
  try {
    const { userId, branch, semester, batch } = req.body;
    
    if (!userId) {
      return res.status(400).json({ ok: false, message: 'userId is required' });
    }
    
    // Check if profile exists
    const existing = await dbGet(`SELECT id FROM profiles WHERE user_id = ?`, [userId]);
    
    if (existing) {
      // Update existing profile
      await dbRun(
        `UPDATE profiles SET branch = ?, semester = ?, batch = ? WHERE user_id = ?`,
        [branch, semester, batch, userId]
      );
    } else {
      // Create new profile
      await dbRun(
        `INSERT INTO profiles (user_id, branch, semester, batch) VALUES (?, ?, ?, ?)`,
        [userId, branch, semester, batch]
      );
    }
    
    res.json({ ok: true, message: 'Profile saved successfully' });
  } catch (err) {
    console.error('Profile save error:', err);
    res.status(500).json({ ok: false, message: 'Failed to save profile' });
  }
});

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await dbGet(
      `SELECT branch, semester, batch, created_at FROM profiles WHERE user_id = ?`,
      [userId]
    );
    
    if (profile) {
      res.json({ ok: true, profile });
    } else {
      res.json({ ok: true, profile: null });
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch profile' });
  }
});

// -------------------------
// File Upload Endpoints
// -------------------------

// Upload single file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const { semester, branch, description, userId } = req.body;

    // Generate file URL
    const fileUrl = `/uploads/${filename}`;

    // Save file metadata to database
    await dbRun(
      `INSERT INTO files (filename, original_name, file_url, semester, uploaded_at) VALUES (?, ?, ?, ?, ?)`,
      [filename, originalname, fileUrl, semester || null, nowIso()]
    );

    console.log(`✅ File uploaded: ${originalname} -> ${filename}`);

    res.json({
      ok: true,
      message: 'File uploaded successfully',
      file: {
        originalName: originalname,
        filename,
        fileUrl,
        mimetype,
        size,
        semester
      }
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ ok: false, message: 'File upload failed' });
  }
});

// Upload multiple files
app.post('/api/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, message: 'No files uploaded' });
    }

    const { semester, branch } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const { originalname, filename, mimetype, size } = file;
      const fileUrl = `/uploads/${filename}`;

      // Save to database
      await dbRun(
        `INSERT INTO files (filename, original_name, file_url, semester, uploaded_at) VALUES (?, ?, ?, ?, ?)`,
        [filename, originalname, fileUrl, semester || null, nowIso()]
      );

      uploadedFiles.push({
        originalName: originalname,
        filename,
        fileUrl,
        mimetype,
        size
      });
    }

    console.log(`✅ ${uploadedFiles.length} files uploaded successfully`);

    res.json({
      ok: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Multiple file upload error:', err);
    res.status(500).json({ ok: false, message: 'File upload failed' });
  }
});

// Get all uploaded files
app.get('/api/files', async (req, res) => {
  try {
    const { semester, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM files';
    let params = [];
    
    if (semester) {
      query += ' WHERE semester = ?';
      params.push(semester);
    }
    
    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const files = await dbAll(query, params);
    res.json({ ok: true, files });
  } catch (err) {
    console.error('Files fetch error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch files' });
  }
});

// Get specific file info
app.get('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbGet('SELECT * FROM files WHERE id = ?', [id]);
    
    if (file) {
      res.json({ ok: true, file });
    } else {
      res.status(404).json({ ok: false, message: 'File not found' });
    }
  } catch (err) {
    console.error('File fetch error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch file' });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await dbGet('SELECT * FROM files WHERE id = ?', [id]);
    
    if (!file) {
      return res.status(404).json({ ok: false, message: 'File not found' });
    }

    // Delete physical file
    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await dbRun('DELETE FROM files WHERE id = ?', [id]);

    console.log(`✅ File deleted: ${file.original_name}`);
    res.json({ ok: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('File delete error:', err);
    res.status(500).json({ ok: false, message: 'Failed to delete file' });
  }
});

// Search files by name
app.get('/api/files/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const files = await dbAll(
      'SELECT * FROM files WHERE original_name LIKE ? ORDER BY id DESC LIMIT 50',
      [`%${query}%`]
    );
    
    res.json({ ok: true, files, count: files.length });
  } catch (err) {
    console.error('File search error:', err);
    res.status(500).json({ ok: false, message: 'File search failed' });
  }
});

// -------------------------
// Error Handlers
// -------------------------
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Keep the process alive
process.stdin.resume();

// -------------------------
// Start server
// -------------------------
const server = app.listen(PORT, () => {
  console.log(`✅ GCET backend listening on http://localhost:${PORT}`);
  console.log(`CORS_ORIGIN: ${CORS_ORIGIN}`);
  if (!process.env.GEMINI_API_KEY) console.log('⚠️  Gemini not configured. Set GEMINI_API_KEY in .env to enable AI.');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
    process.exit(1);
  }
});
