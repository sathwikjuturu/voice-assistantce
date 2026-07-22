import express from 'express';
import { readDb, writeDb } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all calendar events
router.get('/', (req, res) => {
  try {
    const db = readDb();
    res.json(db.calendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add calendar event
router.post('/', (req, res) => {
  try {
    const { title, date, time, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and Date are required' });
    }

    const db = readDb();
    const newEvent = {
      id: "e_" + Date.now(),
      title,
      date, // YYYY-MM-DD
      time: time || '12:00 PM',
      description: description || ''
    };

    db.calendar.push(newEvent);
    writeDb(db);

    res.status(211).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
