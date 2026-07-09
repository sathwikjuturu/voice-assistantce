-- VoiceMail AI Schema for Supabase SQL Editor
-- Run this entire script in Supabase > SQL Editor > New Query

-- 1. Users Table
-- NOTE: If you get a schema cache error, run: NOTIFY pgrst, 'reload schema'; after creating tables
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    otp TEXT,
    "otpExpiry" BIGINT
);

-- 2. Emails Table
CREATE TABLE IF NOT EXISTS public.emails (
    id TEXT PRIMARY KEY,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "recipientEmail" TEXT,
    subject TEXT,
    body TEXT,
    category TEXT,
    folder TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "isStarred" BOOLEAN DEFAULT FALSE,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    "userEmail" TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'Contact'
);

-- 4. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar (
    id TEXT PRIMARY KEY,
    "userEmail" TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '12:00 PM',
    description TEXT
);

-- Disable RLS on all tables (for Express backend bypass via anon key)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar DISABLE ROW LEVEL SECURITY;

-- Reload the PostgREST schema cache so all columns are recognized
NOTIFY pgrst, 'reload schema';
