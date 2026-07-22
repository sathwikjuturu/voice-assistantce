import express from 'express';
import { readDb, writeDb } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all contacts
router.get('/', (req, res) => {
  try {
    const db = readDb();
    res.json(db.contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a contact
router.post('/', (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const db = readDb();
    const newContact = {
      id: "c_" + Date.now(),
      name,
      email,
      phone: phone || '',
      role: role || 'Contact'
    };

    db.contacts.push(newContact);
    writeDb(db);

    res.status(211).json(newContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a contact
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = db.contacts.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    db.contacts.splice(index, 1);
    writeDb(db);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
