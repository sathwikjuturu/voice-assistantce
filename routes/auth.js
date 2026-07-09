import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'voicemail-secret-key-12345';

// Signup Endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const lowerEmail = email.toLowerCase();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "u_" + Date.now();

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name,
        email: lowerEmail,
        password: hashedPassword,
        otp: null,
        otpExpiry: null
      });

    if (insertError) {
      throw insertError;
    }

    const token = jwt.sign({ userId, email: lowerEmail, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(211).json({ message: 'User registered successfully', token, user: { name, email: lowerEmail } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const lowerEmail = email.toLowerCase();

    // Fetch user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint for server connection detection
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Auth service available' });
});

// Forgot Password (generate OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const lowerEmail = email.toLowerCase();

    // Check if user exists
    const { data: user, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!user) {
      return res.status(400).json({ error: 'No account registered with this email' });
    }

    // Generate a simple 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    const { error: updateError } = await supabase
      .from('users')
      .update({ otp, otpExpiry: expiry })
      .eq('email', lowerEmail);

    if (updateError) throw updateError;

    console.log(`[SMS/Email Simulation] OTP for ${lowerEmail} is ${otp}`);

    res.json({ message: 'Verification OTP sent to your email', email: lowerEmail, devOtp: otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const lowerEmail = email.toLowerCase();

    // Fetch user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('otp, otpExpiry')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!user || user.otp !== otp || Date.now() > Number(user.otpExpiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const lowerEmail = email.toLowerCase();

    // Fetch user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('otp, otpExpiry')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!user || user.otp !== otp || Date.now() > Number(user.otpExpiry)) {
      return res.status(400).json({ error: 'Invalid or expired session. Please request OTP again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        otp: null,
        otpExpiry: null
      })
      .eq('email', lowerEmail);

    if (updateError) throw updateError;

    res.json({ message: 'Password reset successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper route to register schema tables or clear DB (admin use, not used in frontend)
export default router;
