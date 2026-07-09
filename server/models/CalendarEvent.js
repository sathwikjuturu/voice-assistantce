import mongoose from 'mongoose';

const CalendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:MM AM/PM
    default: '12:00 PM'
  },
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('CalendarEvent', CalendarEventSchema);
