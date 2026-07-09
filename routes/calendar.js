import express from 'express';
import { supabase } from '../supabaseClient.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all calendar events for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('calendar')
      .select('*')
      .eq('userEmail', req.user.email);

    if (error) throw error;
    res.json(events || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add calendar event
router.post('/', async (req, res) => {
  try {
    const { title, date, time, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and Date are required' });
    }

    const newEvent = {
      id: "e_" + Date.now(),
      userEmail: req.user.email,
      title,
      date, // YYYY-MM-DD
      time: time || '12:00 PM',
      description: description || ''
    };

    const { error } = await supabase
      .from('calendar')
      .insert(newEvent);

    if (error) throw error;

    res.status(211).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
