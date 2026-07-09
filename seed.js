import fs from 'fs/promises';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

// Check if credentials are placeholders or empty
const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL_HERE' && 
  supabaseUrl.trim() !== '' &&
  supabaseKey && 
  supabaseKey !== 'YOUR_SUPABASE_ANON_KEY_HERE' && 
  supabaseKey.trim() !== '';

if (!isConfigured) {
  console.log('\n================================================================');
  console.log('⚠️  SUPABASE NOT YET CONFIGURED');
  console.log('To run this seed script and connect to Supabase:');
  console.log('1. Set up a project at https://supabase.com/');
  console.log('2. Run the SQL statements in schema.sql in your Supabase SQL editor.');
  console.log('3. Retrieve your project URL and API key from Settings > API.');
  console.log('4. Paste them in your .env file:');
  console.log('   SUPABASE_URL=your-supabase-url');
  console.log('   SUPABASE_KEY=your-supabase-anon-key');
  console.log('================================================================\n');
  process.exit(0);
}

// Use service role key to bypass Row Level Security during seeding
const supabase = createClient(supabaseUrl, serviceKey);

async function seedDatabase() {
  console.log('Reading db.json file...');
  let rawData;
  try {
    rawData = await fs.readFile('./db.json', 'utf-8');
  } catch (err) {
    console.error('Error reading db.json:', err.message);
    process.exit(1);
  }

  const data = JSON.parse(rawData);

  // 1. Seed Users
  if (data.users && data.users.length > 0) {
    console.log(`Seeding users (${data.users.length} records)...`);
    const { error } = await supabase
      .from('users')
      .upsert(data.users, { onConflict: 'id' });
    
    if (error) {
      console.error('Error seeding users:', error.message);
      console.error('Hint: Make sure you ran schema.sql in the Supabase SQL editor first.');
    } else {
      console.log('Users seeded successfully!');
    }
  }

  // 2. Seed Emails
  if (data.emails && data.emails.length > 0) {
    console.log(`Seeding emails (${data.emails.length} records)...`);
    const { error } = await supabase
      .from('emails')
      .upsert(data.emails);
    
    if (error) {
      console.error('Error seeding emails:', error.message);
    } else {
      console.log('Emails seeded successfully!');
    }
  }

  // 3. Seed Contacts (inject userEmail constraint)
  if (data.contacts && data.contacts.length > 0) {
    console.log(`Seeding contacts (${data.contacts.length} records)...`);
    const seededContacts = data.contacts.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      role: c.role || 'Contact',
      userEmail: 'john@example.com' // Map to the default user's email
    }));

    const { error } = await supabase
      .from('contacts')
      .upsert(seededContacts);
    
    if (error) {
      console.error('Error seeding contacts:', error.message);
    } else {
      console.log('Contacts seeded successfully!');
    }
  }

  // 4. Seed Calendar Events (inject userEmail constraint)
  if (data.calendar && data.calendar.length > 0) {
    console.log(`Seeding calendar events (${data.calendar.length} records)...`);
    const seededCalendar = data.calendar.map(evt => ({
      id: evt.id,
      title: evt.title,
      date: evt.date,
      time: evt.time || '12:00 PM',
      description: evt.description || '',
      userEmail: 'john@example.com' // Map to the default user's email
    }));

    const { error } = await supabase
      .from('calendar')
      .upsert(seededCalendar);
    
    if (error) {
      console.error('Error seeding calendar:', error.message);
    } else {
      console.log('Calendar events seeded successfully!');
    }
  }

  console.log('\nDatabase seeding process completed!');
  process.exit(0);
}

seedDatabase();
