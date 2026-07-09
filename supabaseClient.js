import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const isUrlValid = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));
const isKeyValid = supabaseKey && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY_HERE' && supabaseKey.trim() !== '';

if (!isUrlValid || !isKeyValid) {
  console.warn('================================================================');
  console.warn('WARNING: SUPABASE_URL or SUPABASE_KEY is not properly configured!');
  console.warn('Please configure them in your .env file.');
  console.warn('================================================================');
}

// Use placeholder credentials to prevent the client instantiation from throwing a hard error.
// The network calls will fail gracefully with clear warnings during the connection check.
const url = isUrlValid ? supabaseUrl : 'https://placeholder-url.supabase.co';
const key = isKeyValid ? supabaseKey : 'placeholder-anon-key';

export const supabase = createClient(url, key);

