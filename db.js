import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

const DB_FILE = path.join(process.cwd(), 'db.json');

// Supabase Client Getter (loads dynamically after dotenv.config() is executed)
let supabase = null;
function getSupabaseClient() {
  if (supabase) return supabase;
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log('[Supabase] Initializing client for target URL:', SUPABASE_URL);
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
  } else {
    console.warn('[Supabase] SUPABASE_URL or SUPABASE_KEY environment variables are missing!');
  }
  return supabase;
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

  const client = getSupabaseClient();
  if (client) {
    try {
      console.log('[Supabase] Fetching database tables...');
      
      const [usersRes, emailsRes, contactsRes, calendarRes, settingsRes] = await Promise.all([
        client.from('users').select('*'),
        client.from('emails').select('*'),
        client.from('contacts').select('*'),
        client.from('calendar').select('*'),
        client.from('settings').select('*').eq('id', 'global').maybeSingle()
      ]);

      if (usersRes.error) throw usersRes.error;
      if (emailsRes.error) throw emailsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (calendarRes.error) throw calendarRes.error;

      // Map Users
      const users = (usersRes.data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        otp: u.otp,
        otpExpiry: u.otp_expiry
      }));

      // Map Emails
      const emails = (emailsRes.data || []).map(m => ({
        id: m.id,
        senderName: m.sender_name,
        senderEmail: m.sender_email,
        recipientEmail: m.recipient_email,
        subject: m.subject,
        body: m.body,
        category: m.category,
        folder: m.folder,
        isRead: m.is_read,
        isStarred: m.is_starred,
        date: m.date
      }));

      // Map Contacts
      const contacts = (contactsRes.data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: c.role
      }));

      // Map Calendar Events
      const calendar = (calendarRes.data || []).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        description: e.description
      }));

      // Map Settings
      const s = settingsRes.data || {};
      const settings = {
        theme: s.theme || "dark",
        voiceSpeed: s.voice_speed !== undefined ? s.voice_speed : 1.0,
        voiceGender: s.voice_gender || "female",
        voiceLanguage: s.voice_language || "en-US",
        continuousListening: s.continuous_listening !== undefined ? s.continuous_listening : false,
        noiseFiltering: s.noise_filtering !== undefined ? s.noise_filtering : true,
        autoReadNew: s.auto_read_new !== undefined ? s.auto_read_new : false,
        signature: s.signature || "Sent from my VoiceMail AI Assistant"
      };

      dbCache = { users, emails, contacts, calendar, settings };

      // If Supabase has zero users, it is fresh. Seed it!
      if (dbCache.users.length === 0) {
        console.log('[Supabase] Empty database detected. Seeding Supabase...');
        dbCache = seedData;
        await writeDbToSupabase(seedData);
      }

      // Sync local fallback file with Supabase data
      fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
      console.log('[Supabase] Database loaded successfully from relational tables.');
      return;
    } catch (err) {
      console.warn('[Supabase Warning] Could not load from relational tables:', err.message);
      console.warn('Ensure you have run the relational tables setup query in your Supabase SQL Editor.');
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

  // Sync to Supabase asynchronously
  const client = getSupabaseClient();
  if (client) {
    writeDbToSupabase(data).catch(err => {
      console.error('[Supabase Sync Error]:', err.message);
    });
  }
}

async function writeDbToSupabase(data) {
  const client = getSupabaseClient();
  if (!client) return;

  // 1. Sync Users
  const dbUsers = data.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    otp: u.otp,
    otp_expiry: u.otpExpiry
  }));
  
  // 2. Sync Emails
  const dbEmails = data.emails.map(m => ({
    id: m.id,
    sender_name: m.senderName,
    sender_email: m.senderEmail,
    recipient_email: m.recipientEmail,
    subject: m.subject,
    body: m.body,
    category: m.category,
    folder: m.folder,
    is_read: m.isRead,
    is_starred: m.isStarred,
    date: m.date
  }));

  // 3. Sync Contacts
  const dbContacts = data.contacts.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role
  }));

  // 4. Sync Calendar Events
  const dbCalendar = data.calendar.map(e => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    description: e.description
  }));

  // 5. Sync Settings
  const s = data.settings || {};
  const dbSettings = {
    id: 'global',
    theme: s.theme,
    voice_speed: s.voiceSpeed,
    voice_gender: s.voiceGender,
    voice_language: s.voiceLanguage,
    continuous_listening: s.continuousListening,
    noise_filtering: s.noiseFiltering,
    auto_read_new: s.autoReadNew,
    signature: s.signature
  };

  // Perform updates in parallel
  await Promise.all([
    client.from('users').upsert(dbUsers),
    client.from('emails').upsert(dbEmails),
    client.from('contacts').upsert(dbContacts),
    client.from('calendar').upsert(dbCalendar),
    client.from('settings').upsert(dbSettings)
  ]);

  // Sync deletions for emails, contacts, and events
  const activeEmailIds = data.emails.map(m => m.id);
  if (activeEmailIds.length > 0) {
    const formatList = `(${activeEmailIds.map(id => `"${id}"`).join(',')})`;
    await client.from('emails').delete().not('id', 'in', formatList);
  }

  const activeContactIds = data.contacts.map(c => c.id);
  if (activeContactIds.length > 0) {
    const formatList = `(${activeContactIds.map(id => `"${id}"`).join(',')})`;
    await client.from('contacts').delete().not('id', 'in', formatList);
  }

  const activeCalendarIds = data.calendar.map(e => e.id);
  if (activeCalendarIds.length > 0) {
    const formatList = `(${activeCalendarIds.map(id => `"${id}"`).join(',')})`;
    await client.from('calendar').delete().not('id', 'in', formatList);
  }

  console.log('[Supabase Sync] Relational database synchronized successfully.');
}
