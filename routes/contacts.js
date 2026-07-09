import express from 'express';
import { supabase } from '../supabaseClient.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get all contacts for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('userEmail', req.user.email);

    if (error) throw error;
    res.json(contacts || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const newContact = {
      id: "c_" + Date.now(),
      userEmail: req.user.email,
      name,
      email,
      phone: phone || '',
      role: role || 'Contact'
    };

    const { error } = await supabase
      .from('contacts')
      .insert(newContact);

    if (error) throw error;

    res.status(211).json(newContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('userEmail', req.user.email);

    if (error) throw error;

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
