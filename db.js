import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false
    }
  });
}

// Memory Cache
let dbCache = null;

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
      category: "primary",
      folder: "inbox",
      isRead: false,
      isStarred: true,
      date: new Date(Date.now() - 30 * 60000).toISOString()
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
      date: new Date(Date.now() - 24 * 3600000).toISOString()
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
      date: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
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

// Initialize Database
export async function initDb() {
  if (dbCache) return;

  if (supabase) {
    try {
      console.log('[Supabase] Fetching database state...');
      const { data, error } = await supabase
        .from('app_data')
        .select('value')
        .eq('key', 'json_db')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Table exists but is empty, seed it
        console.log('[Supabase] Database empty. Seeding Supabase...');
        const { error: insertError } = await supabase
          .from('app_data')
          .insert([{ key: 'json_db', value: seedData }]);
        
        if (insertError) throw insertError;
        dbCache = seedData;
      } else {
        dbCache = data.value;
      }
      
      // Sync local fallback file with Supabase data
      fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
      console.log('[Supabase] Database initialized successfully.');
      return;
    } catch (err) {
      console.warn('[Supabase warning] Could not load from Supabase table "app_data":', err.message);
      console.warn('Ensure you have run the CREATE TABLE query in your Supabase SQL Editor.');
    }
  }

  // Fallback: Read local db.json
  console.log('[Local DB] Loading from local db.json fallback...');
  if (fs.existsSync(DB_FILE)) {
    try {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      dbCache = seedData;
    }
  } else {
    dbCache = seedData;
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
}

export function readDb() {
  if (!dbCache) {
    if (fs.existsSync(DB_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        return seedData;
      }
    }
    return seedData;
  }
  return dbCache;
}

export function writeDb(data) {
  dbCache = data;
  
  // Write locally as backup
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

  // Sync to Supabase in the background
  if (supabase) {
    supabase
      .from('app_data')
      .upsert({ key: 'json_db', value: data })
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Sync Error]:', error.message);
        } else {
          console.log('[Supabase Sync] Database successfully synced.');
        }
      });
  }
}
