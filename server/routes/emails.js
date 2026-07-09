import express from 'express';
import Email from '../models/Email.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Get emails list with query filters
router.get('/', async (req, res) => {
  try {
    const { folder, category, starred, search } = req.query;
    const query = { userId: req.user.userId };

    if (folder) {
      query.folder = folder;
    }
    if (category) {
      query.category = category;
    }
    if (starred === 'true') {
      query.isStarred = true;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { subject: searchRegex },
        { body: searchRegex },
        { senderName: searchRegex },
        { senderEmail: searchRegex }
      ];
    }

    const emails = await Email.find(query).sort({ date: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual email details & mark as read
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send new email (creates sent email)
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const newMail = new Email({
      userId: req.user.userId,
      senderName: req.user.name || 'John Doe',
      senderEmail: req.user.email,
      recipientEmail: to,
      subject: subject || '(No Subject)',
      body: body || '',
      category: 'primary',
      folder: 'sent',
      isRead: true
    });

    await newMail.save();
    res.status(201).json({ message: 'Email sent successfully', email: newMail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a draft
router.post('/draft', async (req, res) => {
  try {
    const { id, to, subject, body } = req.body;
    let draft;

    if (id) {
      draft = await Email.findOne({ _id: id, userId: req.user.userId, folder: 'drafts' });
    }

    if (draft) {
      draft.recipientEmail = to || '';
      draft.subject = subject || '(No Subject)';
      draft.body = body || '';
      await draft.save();
    } else {
      draft = new Email({
        userId: req.user.userId,
        senderName: req.user.name || 'John Doe',
        senderEmail: req.user.email,
        recipientEmail: to || '',
        subject: subject || '(No Subject)',
        body: body || '',
        category: 'primary',
        folder: 'drafts',
        isRead: true
      });
      await draft.save();
    }

    res.json({ message: 'Draft saved', email: draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform folder action (delete, spam, restore, star, read, unread)
router.post('/action', async (req, res) => {
  try {
    const { id, action } = req.body;
    const email = await Email.findOne({ _id: id, userId: req.user.userId });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (action === 'delete') {
      if (email.folder === 'trash') {
        await Email.deleteOne({ _id: id });
        return res.json({ message: 'Email permanently deleted' });
      } else {
        email.folder = 'trash';
        email.category = 'trash';
      }
    } else if (action === 'spam') {
      email.folder = 'spam';
      email.category = 'spam';
    } else if (action === 'star') {
      email.isStarred = !email.isStarred;
    } else if (action === 'unread') {
      email.isRead = false;
    } else if (action === 'read') {
      email.isRead = true;
    } else if (action === 'restore') {
      email.folder = 'inbox';
      email.category = 'primary';
    }

    await email.save();
    res.json({ message: `Action ${action} successful`, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
