import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['primary', 'promotions', 'social', 'spam', 'trash'],
    default: 'primary'
  },
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'trash', 'spam'],
    default: 'inbox'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Email', EmailSchema);
// Seed Data Helper inside the db init can populate default emails on startup if needed.
