import { supabase } from './supabaseClient.js';

// Initialize connection to Supabase and check if it works
export async function initDb() {
  console.log('Initializing Supabase database connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('================================================================');
      console.error('Error connecting to Supabase database:', error.message);
      console.error('Please make sure you have run the schema.sql script in your');
      console.error('Supabase SQL editor, and your credentials in .env are correct.');
      console.error('================================================================');
    } else {
      console.log('================================================================');
      console.log('Successfully connected to Supabase PostgreSQL database!');
      console.log('================================================================');
    }
  } catch (err) {
    console.error('Connection check failed:', err.message);
  }
}
