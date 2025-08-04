import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'https://link-saver-zeta.vercel.app',
  'http://localhost:5173'
];
// Middleware

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionSuccessStatus: 200
};
app.use(cors(corsOptions))

app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create links table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        image_url TEXT,
        domain VARCHAR(255),
        tags TEXT[] DEFAULT '{}',
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Link routes
app.post('/api/links', authenticateToken, async (req, res) => {
  const { url } = req.body;
  const userId = req.user.id;

  try {
    // Fetch page metadata
    console.log('Fetching metadata for URL:', url);
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Untitled';
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';
    const domain = new URL(url).hostname;

    // Generate AI tags and summary
    let tags = [];
    let summary = '';

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Generate tags
      const tagPrompt = `Analyze this webpage content and select the most appropriate tags from these categories: Image, Video, News, Blog, Music, Social Media Post. Return only the relevant tags as a comma-separated list.

Title: ${title}
Description: ${description}
URL: ${url}`;

      const tagResult = await model.generateContent(tagPrompt);
      const tagResponse = await tagResult.response;
      tags = tagResponse.text().split(',').map(tag => tag.trim()).filter(tag =>
        ['Image', 'Video', 'News', 'Blog', 'Music', 'Social Media Post'].includes(tag)
      );

      // Generate summary
      const summaryPrompt = `Create a concise 2-3 sentence summary of this webpage:

Title: ${title}
Description: ${description}`;

      const summaryResult = await model.generateContent(summaryPrompt);
      const summaryResponse = await summaryResult.response;
      summary = summaryResponse.text();

    } catch (aiError) {
      console.error('AI processing error:', aiError);
      // Continue without AI features
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO links (user_id, url, title, description, image_url, domain, tags, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, url, title, description, imageUrl, domain, tags, summary]
    );

    res.status(201).json({
      message: 'Link saved successfully',
      link: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving link:', error);
    res.status(500).json({ message: 'Failed to save link' });
  }
});

app.get('/api/links', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ links: result.rows });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ message: 'Failed to fetch links' });
  }
});

app.get('/api/links/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM links WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ link: result.rows[0] });
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ message: 'Failed to fetch link' });
  }
});

app.delete('/api/links/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ message: 'Failed to delete link' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(() => {
    console.error('Server startup failed. Shutting down.');
    process.exit(1);
  });
