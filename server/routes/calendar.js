import express from 'express';
import CalendarEvent from '../models/CalendarEvent.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get calendar events
router.get('/', async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId: req.user.userId }).sort({ date: 1, time: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create calendar event
router.post('/', async (req, res) => {
  try {
    const { title, date, time, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const event = new CalendarEvent({
      userId: req.user.userId,
      title,
      date,
      time: time || '12:00 PM',
      description: description || ''
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
