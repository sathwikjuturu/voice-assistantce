import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import emailsRouter from './routes/emails.js';
import aiRouter from './routes/ai.js';
import contactsRouter from './routes/contacts.js';
import calendarRouter from './routes/calendar.js';

// Setup environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDb();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/css', express.static('css'));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/calendar', calendarRouter);

// Serve frontend static files
app.use(express.static(path.join(process.cwd())));

// Handle other requests by serving splash.html
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'splash.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`VoiceMail AI Assistant Server running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`====================================================`);
});
