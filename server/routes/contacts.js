import express from 'express';
import Contact from '../models/Contact.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.userId }).sort({ name: 1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const contact = new Contact({
      userId: req.user.userId,
      name,
      email,
      phone: phone || '',
      role: role || 'Contact'
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
