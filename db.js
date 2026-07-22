import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize database with seed data if it does not exist
export function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const seedData = {
      users: [
        {
          id: "1",
          email: "john@example.com",
          password: "$2a$10$Xq8cO0Qv.WqOq7uXq7uXq.Xq8cO0Qv.WqOq7uXq7uXq.Xq8cO0Qv", // hashed 'password123'
          name: "John Doe",
          otp: null,
          otpExpiry: null
        }
      ],
      emails: [
        {
          id: "mail_1",
          senderName: "Sarah Jenkins",
          senderEmail: "sarah.j@company.com",
          recipientEmail: "john@example.com",
          subject: "Q3 Project Review Meeting",
          body: "Hi John, please find attached the slide deck for the Q3 project review scheduled for Friday. Let me know if you have any feedback before the meeting.",
          category: "primary", // primary, promotions, social, spam, trash
          folder: "inbox", // inbox, sent, drafts
          isRead: false,
          isStarred: true,
          date: new Date(Date.now() - 30 * 60000).toISOString() // 30 mins ago
        },
        {
          id: "mail_2",
          senderName: "Google Cloud",
          senderEmail: "noreply@google.com",
          recipientEmail: "john@example.com",
          subject: "Your monthly invoice is ready",
          body: "Your monthly invoice for Google Cloud services is now available in your console. The total amount due is $142.50, which will be charged to your card ending in 4321.",
          category: "promotions",
          folder: "inbox",
          isRead: true,
          isStarred: false,
          date: new Date(Date.now() - 24 * 3600000).toISOString() // yesterday
        },
        {
          id: "mail_3",
          senderName: "HR Department",
          senderEmail: "hr@company.com",
          recipientEmail: "john@example.com",
          subject: "Upcoming Holiday Schedule",
          body: "Please review the updated holiday schedule for the upcoming fiscal year. Note that we will be closed on Thanksgiving and Christmas day.",
          category: "primary",
          folder: "inbox",
          isRead: true,
          isStarred: false,
          date: new Date(Date.now() - 3 * 24 * 3600000).toISOString() // 3 days ago
        },
        {
          id: "mail_4",
          senderName: "LinkedIn Jobs",
          senderEmail: "jobs-listings@linkedin.com",
          recipientEmail: "john@example.com",
          subject: "15 new jobs matching your profile",
          body: "Based on your search history and profile settings, we found 15 new openings that match your software development skills. Click here to apply.",
          category: "social",
          folder: "inbox",
          isRead: false,
          isStarred: false,
          date: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
        },
        {
          id: "mail_5",
          senderName: "Crypto Gainz",
          senderEmail: "spammy-crypto@scam.com",
          recipientEmail: "john@example.com",
          subject: "!!! Get 1000% Returns Overnight !!!",
          body: "Guaranteed crypto trading signals! Invest now and watch your wealth grow 10x by tomorrow. Absolutely risk-free trial!",
          category: "spam",
          folder: "inbox",
          isRead: false,
          isStarred: false,
          date: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
        }
      ],
      contacts: [
        { id: "c_1", name: "Sarah Jenkins", email: "sarah.j@company.com", phone: "+1 (555) 123-4567", role: "Project Manager" },
        { id: "c_2", name: "David Miller", email: "david.m@company.com", phone: "+1 (555) 987-6543", role: "Lead Engineer" },
        { id: "c_3", name: "Emma Watson", email: "emma.w@company.com", phone: "+1 (555) 246-8101", role: "HR Specialist" }
      ],
      calendar: [
        { id: "e_1", title: "Q3 Project Review", date: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[0], time: "10:30 AM", description: "Reviewing slide deck and project status with Sarah." },
        { id: "e_2", title: "One-on-One with David", date: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0], time: "2:00 PM", description: "Discussing technical design details." }
      ],
      settings: {
        theme: "dark",
        voiceSpeed: 1.0,
        voiceGender: "female",
        voiceLanguage: "en-US",
        continuousListening: false,
        noiseFiltering: true,
        autoReadNew: false,
        signature: "Sent from my VoiceMail AI Assistant"
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
}

export function readDb() {
  initDb();
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

export function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
