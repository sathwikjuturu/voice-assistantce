import express from 'express';
import { supabase } from '../supabaseClient.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all email routes
router.use(authMiddleware);

// Get emails based on folder, category, starred, or search parameters
router.get('/', async (req, res) => {
  try {
    const { folder, category, starred, search } = req.query;
    const userEmail = req.user.email;

    let query = supabase.from('emails').select('*');

    // Filter by Folder ownership
    if (folder === 'drafts' || folder === 'sent') {
      query = query.eq('senderEmail', userEmail).eq('folder', folder);
    } else if (folder) {
      query = query.eq('recipientEmail', userEmail).eq('folder', folder);
    } else {
      // Default: Inbox (received by the user)
      query = query.eq('recipientEmail', userEmail);
      if (!category || (category !== 'trash' && category !== 'spam')) {
        query = query.eq('folder', 'inbox');
      }
    }

    // Filter by Category
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by Starred
    if (starred === 'true') {
      query = query.eq('isStarred', true);
    }

    // Search query
    if (search) {
      const q = `%${search}%`;
      query = query.or(`subject.ilike.${q},body.ilike.${q},senderName.ilike.${q},senderEmail.ilike.${q}`);
    }

    // Sort by date descending
    query = query.order('date', { ascending: false });

    const { data: emails, error } = await query;
    if (error) throw error;

    res.json(emails || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual email by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch email
    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from('emails')
      .update({ isRead: true })
      .eq('id', id);

    if (updateError) throw updateError;

    email.isRead = true; // return updated state
    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send new email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient email (to) is required' });
    }

    const newEmail = {
      id: "mail_" + Date.now(),
      senderName: req.user.name || req.user.email.split('@')[0],
      senderEmail: req.user.email,
      recipientEmail: to,
      subject: subject || '(No Subject)',
      body: body || '',
      category: 'primary',
      folder: 'sent',
      isRead: true,
      isStarred: false,
      date: new Date().toISOString()
    };

    const { error } = await supabase
      .from('emails')
      .insert(newEmail);

    if (error) throw error;

    res.status(211).json({ message: 'Email sent successfully', email: newEmail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save or Update Draft
router.post('/draft', async (req, res) => {
  try {
    const { id, to, subject, body } = req.body;
    const userEmail = req.user.email;

    if (id) {
      // Check if draft exists and is owned by this user
      const { data: existingDraft, error: checkError } = await supabase
        .from('emails')
        .select('id')
        .eq('id', id)
        .eq('folder', 'drafts')
        .eq('senderEmail', userEmail)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingDraft) {
        // Update existing draft
        const updatedFields = {
          recipientEmail: to || '',
          subject: subject || '',
          body: body || '',
          date: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('emails')
          .update(updatedFields)
          .eq('id', id);

        if (updateError) throw updateError;

        return res.json({
          message: 'Draft updated successfully',
          email: { id, senderName: req.user.name || userEmail.split('@')[0], senderEmail: userEmail, ...updatedFields, category: 'primary', folder: 'drafts', isRead: true, isStarred: false }
        });
      }
    }

    // Create new draft
    const newDraft = {
      id: "mail_" + Date.now(),
      senderName: req.user.name || userEmail.split('@')[0],
      senderEmail: userEmail,
      recipientEmail: to || '',
      subject: subject || '',
      body: body || '',
      category: 'primary',
      folder: 'drafts',
      isRead: true,
      isStarred: false,
      date: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('emails')
      .insert(newDraft);

    if (insertError) throw insertError;

    res.status(211).json({ message: 'Draft saved successfully', email: newDraft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform operations (delete, spam, star, mark unread, restore)
router.post('/action', async (req, res) => {
  try {
    const { id, action } = req.body;
    if (!id || !action) {
      return res.status(400).json({ error: 'Email ID and action are required' });
    }

    // Fetch email
    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    let updatedFields = {};
    let deletePermanently = false;

    switch (action) {
      case 'delete':
        if (email.category === 'trash') {
          deletePermanently = true;
        } else {
          updatedFields = { category: 'trash', folder: 'trash' };
        }
        break;
      case 'spam':
        updatedFields = { category: 'spam', folder: 'spam' };
        break;
      case 'star':
        updatedFields = { isStarred: !email.isStarred };
        break;
      case 'unread':
        updatedFields = { isRead: false };
        break;
      case 'read':
        updatedFields = { isRead: true };
        break;
      case 'restore':
        updatedFields = { category: 'primary', folder: 'inbox' };
        break;
      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    if (deletePermanently) {
      const { error: deleteError } = await supabase
        .from('emails')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return res.json({ message: 'Email deleted permanently' });
    } else {
      const { error: updateError } = await supabase
        .from('emails')
        .update(updatedFields)
        .eq('id', id);

      if (updateError) throw updateError;
      
      const updatedEmail = { ...email, ...updatedFields };
      res.json({ message: `Action '${action}' completed successfully`, email: updatedEmail });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
