import express from 'express';
import { readDb, writeDb } from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all email routes
router.use(authMiddleware);

// Get emails based on folder, category, starred, or search parameters
router.get('/', (req, res) => {
  try {
    const { folder, category, starred, search } = req.query;
    const db = readDb();
    const userEmail = req.user.email;

    let filtered = db.emails.filter(email => {
      // Drafts and Sent are owned by this user
      if (email.folder === 'drafts' || email.folder === 'sent') {
        return email.senderEmail === userEmail;
      }
      // Inbox emails are received by this user
      return email.recipientEmail === userEmail;
    });

    // Filter by Folder
    if (folder) {
      filtered = filtered.filter(email => email.folder === folder);
    } else {
      // By default, if folder is inbox, exclude trash and spam from standard list
      if (!category || (category !== 'trash' && category !== 'spam')) {
        filtered = filtered.filter(email => email.folder === 'inbox' && email.category !== 'trash' && email.category !== 'spam');
      }
    }

    // Filter by Category
    if (category) {
      filtered = filtered.filter(email => email.category === category);
    }

    // Filter by Starred
    if (starred === 'true') {
      filtered = filtered.filter(email => email.isStarred === true);
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(email => 
        (email.subject && email.subject.toLowerCase().includes(q)) ||
        (email.body && email.body.toLowerCase().includes(q)) ||
        (email.senderName && email.senderName.toLowerCase().includes(q)) ||
        (email.senderEmail && email.senderEmail.toLowerCase().includes(q))
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual email by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const emailIndex = db.emails.findIndex(e => e.id === id);

    if (emailIndex === -1) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Mark as read
    db.emails[emailIndex].isRead = true;
    writeDb(db);

    res.json(db.emails[emailIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send new email
router.post('/send', (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient email (to) is required' });
    }

    const db = readDb();
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

    db.emails.push(newEmail);
    writeDb(db);

    res.status(211).json({ message: 'Email sent successfully', email: newEmail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save or Update Draft
router.post('/draft', (req, res) => {
  try {
    const { id, to, subject, body } = req.body;
    const db = readDb();

    if (id) {
      // Update existing draft
      const draftIndex = db.emails.findIndex(e => e.id === id && e.folder === 'drafts');
      if (draftIndex !== -1) {
        db.emails[draftIndex].recipientEmail = to || '';
        db.emails[draftIndex].subject = subject || '';
        db.emails[draftIndex].body = body || '';
        db.emails[draftIndex].date = new Date().toISOString();
        writeDb(db);
        return res.json({ message: 'Draft updated successfully', email: db.emails[draftIndex] });
      }
    }

    // Create new draft
    const newDraft = {
      id: "mail_" + Date.now(),
      senderName: req.user.name || req.user.email.split('@')[0],
      senderEmail: req.user.email,
      recipientEmail: to || '',
      subject: subject || '',
      body: body || '',
      category: 'primary',
      folder: 'drafts',
      isRead: true,
      isStarred: false,
      date: new Date().toISOString()
    };

    db.emails.push(newDraft);
    writeDb(db);

    res.status(211).json({ message: 'Draft saved successfully', email: newDraft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform operations (delete, spam, star, mark unread, restore)
router.post('/action', (req, res) => {
  try {
    const { id, action } = req.body;
    if (!id || !action) {
      return res.status(400).json({ error: 'Email ID and action are required' });
    }

    const db = readDb();
    const emailIndex = db.emails.findIndex(e => e.id === id);

    if (emailIndex === -1) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const email = db.emails[emailIndex];

    switch (action) {
      case 'delete':
        // If already in trash, delete permanently
        if (email.category === 'trash') {
          db.emails.splice(emailIndex, 1);
          writeDb(db);
          return res.json({ message: 'Email deleted permanently' });
        } else {
          email.category = 'trash';
          email.folder = 'trash';
        }
        break;
      case 'spam':
        email.category = 'spam';
        email.folder = 'spam';
        break;
      case 'star':
        email.isStarred = !email.isStarred;
        break;
      case 'unread':
        email.isRead = false;
        break;
      case 'read':
        email.isRead = true;
        break;
      case 'restore':
        email.category = 'primary';
        email.folder = 'inbox';
        break;
      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    writeDb(db);
    res.json({ message: `Action '${action}' completed successfully`, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
