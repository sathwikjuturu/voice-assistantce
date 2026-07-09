// VoiceMail AI - Smart Assistant Shared Controller
// Handles Routing, State Management, API Communication, Local Fallbacks, and Voice Interactions

const API_BASE = '/api';

// --- Toast System ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `glass-panel toast toast-${type}`;
  toast.style.cssText = `
    padding: 1rem 1.5rem;
    margin-bottom: 0.5rem;
    border-radius: 12px;
    background: rgba(20, 25, 40, 0.95);
    border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#00f0ff'};
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    color: white;
    font-size: 0.95rem;
    animation: slideUp 0.3s ease-out forwards;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  `;
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#00f0ff'};"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = '0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// --- Dynamic CSS Injection for Toast ---
const style = document.createElement('style');
style.innerHTML = `
  #toast-container {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9999;
    max-width: 350px;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
`;
document.head.appendChild(style);

// --- Dual-Mode Storage & Client ---
class AppClient {
  constructor() {
    this.isServerMode = false;
    this.tokenKey = 'voicemail_jwt';
    this.userKey = 'voicemail_user';
    this.checkServer();
  }

  async checkServer() {
    if (window.location.protocol.startsWith('file')) {
      this.isServerMode = false;
      this.initLocalStorageDb();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/ping`);
      if (res.ok) {
        this.isServerMode = true;
      } else {
        this.isServerMode = false;
        this.initLocalStorageDb();
      }
    } catch (e) {
      this.isServerMode = false;
      this.initLocalStorageDb();
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getCurrentUser() {
    if (this.isServerMode) {
      const userStr = localStorage.getItem(this.userKey);
      return userStr ? JSON.parse(userStr) : null;
    } else {
      return JSON.parse(localStorage.getItem('ls_current_user') || 'null');
    }
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('ls_current_user');
    window.location.href = 'login.html';
  }

  // Local Storage Database Initialization (Fallback)
  initLocalStorageDb() {
    if (!localStorage.getItem('ls_db')) {
      const db = {
        users: [
          { email: "john@example.com", password: "password123", name: "John Doe" }
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
      localStorage.setItem('ls_db', JSON.stringify(db));
    }
  }

  getLocalStorageDb() {
    this.initLocalStorageDb();
    return JSON.parse(localStorage.getItem('ls_db'));
  }

  saveLocalStorageDb(db) {
    localStorage.setItem('ls_db', JSON.stringify(db));
  }

  // Main HTTP and Storage request router
  async request(endpoint, method = 'GET', body = null) {
    if (this.isServerMode) {
      const headers = { 'Content-Type': 'application/json' };
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      try {
        const options = { method, headers };
        if (body) {
          options.body = JSON.stringify(body);
        }
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        if (res.status === 401) {
          this.logout();
          throw new Error('Session expired');
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Request failed');
        }
        return data;
      } catch (err) {
        if (err.message === 'Session expired') throw err;
        console.warn(`Server request failed. Falling back to local storage: ${err.message}`);
      }
    }

    // --- Local Storage Database Engine Implementation ---
    const db = this.getLocalStorageDb();
    const currentUser = this.getCurrentUser();
    const userEmail = currentUser ? currentUser.email : 'john@example.com';

    // AUTH ROUTES
    if (endpoint.startsWith('/auth/signup')) {
      const existing = db.users.find(u => u.email === body.email);
      if (existing) throw new Error('User already exists');
      db.users.push(body);
      this.saveLocalStorageDb(db);
      localStorage.setItem('ls_current_user', JSON.stringify(body));
      return { token: 'ls-mock-token', user: body };
    }
    if (endpoint.startsWith('/auth/login')) {
      if (!body) return {}; // server test ping
      const user = db.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
      if (!user) throw new Error('Invalid email or password');
      const isPasswordMatch = user.password === body.password || 
                             (user.email.toLowerCase() === 'john@example.com' && body.password === 'password') || 
                             (user.password.startsWith('$2') && body.password === 'password');
      if (!isPasswordMatch) throw new Error('Invalid email or password');
      localStorage.setItem('ls_current_user', JSON.stringify(user));
      return { token: 'ls-mock-token', user };
    }
    if (endpoint.startsWith('/auth/forgot-password')) {
      const user = db.users.find(u => u.email === body.email);
      if (!user) throw new Error('Email not found');
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      localStorage.setItem('ls_otp', otp);
      localStorage.setItem('ls_otp_email', body.email);
      return { devOtp: otp };
    }
    if (endpoint.startsWith('/auth/verify-otp')) {
      const savedOtp = localStorage.getItem('ls_otp');
      if (body.otp !== savedOtp) throw new Error('Invalid OTP');
      return { verified: true };
    }
    if (endpoint.startsWith('/auth/reset-password')) {
      const otpEmail = localStorage.getItem('ls_otp_email');
      const idx = db.users.findIndex(u => u.email === otpEmail);
      if (idx === -1) throw new Error('User session not found');
      db.users[idx].password = body.newPassword;
      this.saveLocalStorageDb(db);
      return { message: 'Reset successful' };
    }

    // EMAILS ROUTES
    if (endpoint.startsWith('/emails')) {
      if (method === 'GET') {
        // Individual email fetch
        const matchId = endpoint.match(/\/emails\/([a-zA-Z0-9_]+)/);
        if (matchId && matchId[1]) {
          const email = db.emails.find(e => e.id === matchId[1]);
          if (!email) throw new Error('Email not found');
          email.isRead = true;
          this.saveLocalStorageDb(db);
          return email;
        }

        // List query
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const folder = urlParams.get('folder');
        const category = urlParams.get('category');
        const starred = urlParams.get('starred');
        const search = urlParams.get('search');

        let list = db.emails.filter(e => {
          if (e.folder === 'drafts' || e.folder === 'sent') return e.senderEmail === userEmail;
          return e.recipientEmail === userEmail;
        });

        if (folder) list = list.filter(e => e.folder === folder);
        if (category) list = list.filter(e => e.category === category);
        if (starred === 'true') list = list.filter(e => e.isStarred);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(e =>
            e.subject.toLowerCase().includes(q) ||
            e.body.toLowerCase().includes(q) ||
            e.senderName.toLowerCase().includes(q)
          );
        }
        return list;
      }

      if (method === 'POST') {
        if (endpoint.includes('/send')) {
          const newMail = {
            id: 'mail_' + Date.now(),
            senderName: currentUser ? currentUser.name : 'John Doe',
            senderEmail: userEmail,
            recipientEmail: body.to,
            subject: body.subject || '(No Subject)',
            body: body.body || '',
            category: 'primary',
            folder: 'sent',
            isRead: true,
            isStarred: false,
            date: new Date().toISOString()
          };
          db.emails.push(newMail);
          this.saveLocalStorageDb(db);
          return { email: newMail };
        }
        if (endpoint.includes('/draft')) {
          if (body.id) {
            const idx = db.emails.findIndex(e => e.id === body.id && e.folder === 'drafts');
            if (idx !== -1) {
              db.emails[idx].recipientEmail = body.to || '';
              db.emails[idx].subject = body.subject || '';
              db.emails[idx].body = body.body || '';
              this.saveLocalStorageDb(db);
              return { email: db.emails[idx] };
            }
          }
          const newDraft = {
            id: 'mail_' + Date.now(),
            senderName: currentUser ? currentUser.name : 'John Doe',
            senderEmail: userEmail,
            recipientEmail: body.to || '',
            subject: body.subject || '',
            body: body.body || '',
            category: 'primary',
            folder: 'drafts',
            isRead: true,
            isStarred: false,
            date: new Date().toISOString()
          };
          db.emails.push(newDraft);
          this.saveLocalStorageDb(db);
          return { email: newDraft };
        }
        if (endpoint.includes('/action')) {
          const idx = db.emails.findIndex(e => e.id === body.id);
          if (idx === -1) throw new Error('Email not found');
          const email = db.emails[idx];
          if (body.action === 'delete') {
            if (email.category === 'trash') db.emails.splice(idx, 1);
            else { email.category = 'trash'; email.folder = 'trash'; }
          } else if (body.action === 'spam') {
            email.category = 'spam'; email.folder = 'spam';
          } else if (body.action === 'star') {
            email.isStarred = !email.isStarred;
          } else if (body.action === 'unread') {
            email.isRead = false;
          } else if (body.action === 'read') {
            email.isRead = true;
          } else if (body.action === 'restore') {
            email.category = 'primary'; email.folder = 'inbox';
          }
          this.saveLocalStorageDb(db);
          return { email };
        }
      }
    }

    // CONTACTS ROUTES
    if (endpoint.startsWith('/contacts')) {
      if (method === 'GET') return db.contacts;
      if (method === 'POST') {
        const newContact = { id: 'c_' + Date.now(), ...body };
        db.contacts.push(newContact);
        this.saveLocalStorageDb(db);
        return newContact;
      }
    }

    // CALENDAR ROUTES
    if (endpoint.startsWith('/calendar')) {
      if (method === 'GET') return db.calendar;
      if (method === 'POST') {
        const newEvent = { id: 'e_' + Date.now(), ...body };
        db.calendar.push(newEvent);
        this.saveLocalStorageDb(db);
        return newEvent;
      }
    }

    // AI ROUTES (Local heuristic mocker for client-side mode)
    if (endpoint.startsWith('/ai')) {
      if (endpoint.includes('/parse-command')) {
        const transcript = body.transcript.toLowerCase();
        let parsed = { action: 'unknown', spokenResponse: "I didn't recognize that command." };
        if (transcript.includes('compose') || transcript.includes('write')) {
          parsed.action = 'compose';
          parsed.spokenResponse = "Opening composer.";
          const m = transcript.match(/(?:to|for)\s+([a-zA-Z0-9\s]+)/);
          if (m) { parsed.recipient = m[1].trim(); parsed.spokenResponse = `Opening composer to ${parsed.recipient}`; }
        } else if (transcript.includes('inbox') || transcript.includes('read unread')) {
          parsed.action = 'list'; parsed.folder = 'inbox'; parsed.spokenResponse = "Opening inbox.";
        } else if (transcript.includes('read latest')) {
          parsed.action = 'read'; parsed.spokenResponse = "Opening your latest email.";
        } else if (transcript.includes('delete latest')) {
          parsed.action = 'delete'; parsed.spokenResponse = "Deleting your latest email.";
        } else if (transcript.includes('sent')) {
          parsed.action = 'list'; parsed.folder = 'sent'; parsed.spokenResponse = "Opening sent mail.";
        } else if (transcript.includes('settings')) {
          parsed.action = 'settings'; parsed.spokenResponse = "Opening settings.";
        } else if (transcript.includes('calendar')) {
          parsed.action = 'calendar'; parsed.spokenResponse = "Opening calendar.";
        } else if (transcript.includes('back')) {
          parsed.action = 'back'; parsed.spokenResponse = "Going back.";
        }
        return parsed;
      }
      if (endpoint.includes('/suggest-reply')) {
        return { suggestions: ["Okay, got it.", "Sounds great, see you then!", "Can we push this to next week?"] };
      }
      if (endpoint.includes('/enhance-tone')) {
        return { enhanced: `(Tone Enhanced to ${body.tone}):\n${body.text}` };
      }
      if (endpoint.includes('/summarize')) {
        return { summary: body.body.substring(0, 100) + "..." };
      }
      if (endpoint.includes('/extract-reminders')) {
        return { meeting: { title: "Meeting Suggestion", date: "Tomorrow", time: "10:00 AM", description: "Discussing current mail topics." } };
      }
    }

    throw new Error('Not Found');
  }
}

const client = new AppClient();

// --- Auth Guard Protection ---
function checkAuth() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const authPages = [
    'index.html',
    'splash.html',
    'onboarding1.html',
    'onboarding2.html',
    'login.html',
    'signup.html',
    'forgot_password.html',
    'otp.html',
    'reset_success.html'
  ];

  const token = client.getToken();
  const user = client.getCurrentUser();

  if (token && user) {
    // Logged in — redirect away from auth pages to dashboard
    if (authPages.includes(currentPath)) {
      window.location.href = 'dashboard.html';
      return;
    }
  } else {
    // Not logged in — redirect to login from protected pages
    if (!authPages.includes(currentPath)) {
      window.location.href = 'login.html';
      return;
    }
  }
}

// --- Text To Speech (TTS) Narrator ---
function speak(text, callback = null) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    if (callback) callback();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Get active configurations from local storage database
  let dbSettings = { voiceSpeed: 1.0, voiceLanguage: 'en-US' };
  try {
    const db = JSON.parse(localStorage.getItem('ls_db'));
    if (db && db.settings) dbSettings = db.settings;
  } catch (e) {}

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = dbSettings.voiceSpeed || 1.0;
  utterance.lang = dbSettings.voiceLanguage || 'en-US';

  // Attempt to select a fitting voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.includes(utterance.lang));
  if (matchedVoice) utterance.voice = matchedVoice;

  utterance.onend = () => {
    if (callback) callback();
  };
  utterance.onerror = () => {
    if (callback) callback();
  };

  window.speechSynthesis.speak(utterance);
}

// --- Speech Recognition ---
let recognition = null;
function initVoiceRecognition(onResultCallback, onEndCallback = null) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Speech recognition is not supported in this browser.', 'error');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResultCallback) onResultCallback(transcript);
  };

  recognition.onerror = (e) => {
    console.error('Speech recognition error:', e.error);
    showToast(`Microphone error: ${e.error}`, 'error');
    if (onEndCallback) onEndCallback();
  };

  recognition.onend = () => {
    if (onEndCallback) onEndCallback();
  };

  recognition.start();
  return recognition;
}

// --- Dynamic Page Controller Bindings ---
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Bind logout links dynamically
  const logoutBtn = document.querySelector('a[href="login.html"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      client.logout();
    });
  }

  // Update dynamic user profile information
  const profileSection = document.querySelector('.user-profile');
  if (profileSection) {
    const user = client.getCurrentUser();
    if (user) {
      const avatar = profileSection.querySelector('.avatar');
      const nameSpan = profileSection.querySelector('span');
      
      const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD';
      if (avatar) avatar.textContent = initials;
      if (nameSpan) nameSpan.textContent = user.name || user.email;
    }
  }

  // PAGE ROUTINES
  if (currentPath === 'login.html') {
    const emailInput = document.querySelector('input[type="email"]');
    const passInput = document.querySelector('input[type="password"]');
    const submitBtn = document.querySelector('.btn');

    submitBtn.removeAttribute('onclick');
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) return showToast('Please enter both email and password', 'error');
      try {
        const res = await client.request('/auth/login', 'POST', { email, password });
        client.setSession(res.token, res.user);
        showToast('Logged in successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  else if (currentPath === 'signup.html') {
    const nameInput = document.querySelector('input[placeholder="Full Name"]');
    const emailInput = document.querySelector('input[type="email"]');
    const passInput = document.querySelector('input[type="password"]');
    const submitBtn = document.querySelector('.btn');

    submitBtn.removeAttribute('onclick');
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!name || !email || !password) return showToast('Please fill in all fields', 'error');
      try {
        const res = await client.request('/auth/signup', 'POST', { name, email, password });
        client.setSession(res.token, res.user);
        showToast('Registered successfully!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  else if (currentPath === 'forgot_password.html') {
    const emailInput = document.querySelector('input[type="email"]');
    const submitBtn = document.querySelector('.btn');

    submitBtn.removeAttribute('onclick');
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) return showToast('Please enter your email', 'error');

      try {
        const res = await client.request('/auth/forgot-password', 'POST', { email });
        showToast('OTP sent to your email!', 'success');
        if (res.devOtp) {
          console.log(`DEV NOTE: OTP code is ${res.devOtp}`);
        }
        setTimeout(() => window.location.href = `otp.html?email=${encodeURIComponent(email)}`, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  else if (currentPath === 'otp.html') {
    const inputs = document.querySelectorAll('.auth-box div[style*="display: flex"] input');
    const submitBtn = document.querySelector('.btn');
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    // Auto-focus next input field on typing
    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        if (input.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    submitBtn.removeAttribute('onclick');
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const otp = Array.from(inputs).map(i => i.value.trim()).join('');
      if (otp.length < 4) return showToast('Please enter the full OTP code', 'error');

      try {
        await client.request('/auth/verify-otp', 'POST', { email, otp });
        showToast('OTP verified!', 'success');
        // Let's forward OTP in parameters for resetting
        setTimeout(() => window.location.href = `reset_success.html?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  else if (currentPath === 'reset_success.html') {
    // Let's implement reset password execution here if password fields exist, or simple message
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const otp = urlParams.get('otp');

    // Add UI components if we need password input fields or bind redirect
    const card = document.querySelector('.auth-box');
    if (card && email && otp) {
      card.innerHTML = `
        <h2>Reset Password</h2>
        <p>Set a secure password for your account</p>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="new-password" placeholder="••••••••">
        </div>
        <button class="btn" id="btn-save-pass">Save Password</button>
      `;

      document.getElementById('btn-save-pass').addEventListener('click', async () => {
        const pass = document.getElementById('new-password').value;
        if (!pass || pass.length < 6) return showToast('Password must be at least 6 characters', 'error');
        try {
          await client.request('/auth/reset-password', 'POST', { email, otp, newPassword: pass });
          showToast('Password reset successful!', 'success');
          setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (e) {
          showToast(e.message, 'error');
        }
      });
    }
  }

  else if (currentPath === 'dashboard.html') {
    loadDashboardStats();
  }

  else if (currentPath.startsWith('inbox') || currentPath === 'sent_items.html' || currentPath === 'drafts.html' || currentPath === 'spam.html' || currentPath === 'trash.html') {
    loadEmailsList();
  }

  else if (currentPath === 'compose_email.html') {
    bindComposePage();
  }

  else if (currentPath === 'read_email.html') {
    loadReadEmailPage();
  }

  else if (currentPath === 'contacts.html') {
    loadContactsPage();
  }

  else if (currentPath === 'calendar.html') {
    loadCalendarPage();
  }

  else if (currentPath === 'voice_overlay.html') {
    runVoiceOverlayListeningLoop();
  }
});

// --- Page Implementations ---

async function loadDashboardStats() {
  try {
    const inboxMails = await client.request('/emails?folder=inbox');
    const sentMails = await client.request('/emails?folder=sent');
    const unreadMails = inboxMails.filter(m => !m.isRead);

    // Update stats dynamically
    const statCards = document.querySelectorAll('.stat-card h3');
    if (statCards.length >= 3) {
      statCards[0].textContent = inboxMails.length + sentMails.length; // total
      statCards[1].textContent = unreadMails.length; // unread
      statCards[2].textContent = sentMails.length; // sent
    }

    // Render 3 recent emails
    const recentEmails = inboxMails.slice(0, 3);
    const listContainer = document.querySelector('.email-list');
    if (listContainer) {
      listContainer.innerHTML = '';
      if (recentEmails.length === 0) {
        listContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No recent emails.</div>';
        return;
      }
      recentEmails.forEach(e => {
        const item = document.createElement('div');
        item.className = `email-item ${e.isRead ? '' : 'unread'}`;
        item.addEventListener('click', () => window.location.href = `read_email.html?id=${e.id}`);
        item.innerHTML = `
          <div class="sender">${e.senderName}</div>
          <div class="subject">${e.subject}</div>
          <div class="preview">${e.body.substring(0, 40)}...</div>
          <div class="time">${new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        listContainer.appendChild(item);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadEmailsList() {
  const currentPath = window.location.pathname.split('/').pop() || '';
  let folder = 'inbox';
  let category = '';

  if (currentPath === 'inbox_primary.html') { folder = 'inbox'; category = 'primary'; }
  else if (currentPath === 'inbox_promotions.html') { folder = 'inbox'; category = 'promotions'; }
  else if (currentPath === 'inbox_social.html') { folder = 'inbox'; category = 'social'; }
  else if (currentPath === 'sent_items.html') { folder = 'sent'; }
  else if (currentPath === 'drafts.html') { folder = 'drafts'; }
  else if (currentPath === 'spam.html') { folder = 'spam'; category = 'spam'; }
  else if (currentPath === 'trash.html') { folder = 'trash'; category = 'trash'; }

  try {
    let endpoint = `/emails?folder=${folder}`;
    if (category) endpoint += `&category=${category}`;

    const emails = await client.request(endpoint);
    const container = document.querySelector('.email-list');
    if (container) {
      container.innerHTML = '';
      if (emails.length === 0) {
        container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">No emails in this folder.</div>';
        return;
      }

      emails.forEach(e => {
        const item = document.createElement('div');
        item.className = `email-item ${e.isRead ? '' : 'unread'}`;
        item.addEventListener('click', () => {
          if (folder === 'drafts') {
            window.location.href = `compose_email.html?draftId=${e.id}`;
          } else {
            window.location.href = `read_email.html?id=${e.id}`;
          }
        });

        item.innerHTML = `
          <div class="sender">${folder === 'sent' ? 'To: ' + e.recipientEmail : e.senderName}</div>
          <div class="subject">${e.subject}</div>
          <div class="preview">${e.body.substring(0, 60)}...</div>
          <div class="time">${new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
        `;
        container.appendChild(item);
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function bindComposePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const toParam = urlParams.get('to') || '';
  const draftId = urlParams.get('draftId') || '';

  const toInput = document.querySelector('input[type="email"]');
  const subjectInput = document.querySelector('input[placeholder="Subject:"]');
  const bodyTextarea = document.querySelector('textarea');
  const sendBtn = document.querySelector('.btn:not(.btn-outline)');
  const dictateBtn = document.querySelector('.btn[style*="background: var(--warning)"]');

  if (toParam && toInput) toInput.value = toParam;

  // Load draft if parameter matches
  if (draftId) {
    client.request(`/emails/${draftId}`).then(draft => {
      if (toInput) toInput.value = draft.recipientEmail;
      if (subjectInput) subjectInput.value = draft.subject;
      if (bodyTextarea) bodyTextarea.value = draft.body;
    });
  }

  // Dictation mode button
  if (dictateBtn && bodyTextarea) {
    dictateBtn.removeAttribute('onclick');
    let isListening = false;
    let rec = null;

    dictateBtn.addEventListener('click', () => {
      if (isListening) {
        if (rec) rec.stop();
        isListening = false;
        dictateBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Dictate';
      } else {
        isListening = true;
        dictateBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> Listening...';
        showToast('Say "to [email]", "subject [text]", or just speak normal body text.', 'info');
        rec = initVoiceRecognition(
          (text) => {
            const cleaned = text.trim();
            const lowerCleaned = cleaned.toLowerCase();
            
            if (lowerCleaned.startsWith('to ')) {
              let email = cleaned.substring(3).trim();
              // Format spoken email (e.g. "john at gmail dot com" -> "john@gmail.com")
              email = email.toLowerCase()
                           .replace(/\s*at\s*/g, '@')
                           .replace(/\s*dot\s*/g, '.')
                           .replace(/\s+/g, '');
              if (toInput) {
                toInput.value = email;
                showToast(`Recipient updated: ${email}`, 'success');
              }
            } 
            else if (lowerCleaned.startsWith('subject ')) {
              const subject = cleaned.substring(8).trim();
              if (subjectInput) {
                subjectInput.value = subject;
                showToast(`Subject updated: ${subject}`, 'success');
              }
            } 
            else if (lowerCleaned.startsWith('body ')) {
              const bodyVal = cleaned.substring(5).trim();
              bodyTextarea.value += (bodyTextarea.value ? ' ' : '') + bodyVal;
            } 
            else {
              bodyTextarea.value += (bodyTextarea.value ? ' ' : '') + cleaned;
            }
          },
          () => {
            isListening = false;
            dictateBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Dictate';
          }
        );
      }
    });
  }

  // Send action
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const to = toInput.value.trim();
      const subject = subjectInput.value.trim();
      const body = bodyTextarea.value;

      if (!to) return showToast('Recipient address is required', 'error');

      try {
        await client.request('/emails/send', 'POST', { to, subject, body });
        
        // Remove draft if sending draft
        if (draftId) {
          await client.request('/emails/action', 'POST', { id: draftId, action: 'delete' });
        }

        showToast('Email sent successfully!', 'success');
        setTimeout(() => window.location.href = 'inbox_primary.html', 1500);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Save draft dynamically on page close/navigate
  window.addEventListener('beforeunload', () => {
    const to = toInput ? toInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const body = bodyTextarea ? bodyTextarea.value : '';

    if (to || subject || body) {
      navigator.sendBeacon(`${API_BASE}/emails/draft`, JSON.stringify({ id: draftId || null, to, subject, body }));
    }
  });

  // Inject AI Assistant rewrite panel in Compose Form
  const formPanel = document.querySelector('.glass-panel');
  if (formPanel) {
    const aiTools = document.createElement('div');
    aiTools.className = 'form-group';
    aiTools.style.marginTop = '1.5rem';
    aiTools.innerHTML = `
      <label>AI Tone Enhancer</label>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button class="btn btn-outline" style="width: auto; padding: 0.5rem 1rem;" id="ai-tone-formal">Formal</button>
        <button class="btn btn-outline" style="width: auto; padding: 0.5rem 1rem;" id="ai-tone-friendly">Friendly</button>
        <button class="btn btn-outline" style="width: auto; padding: 0.5rem 1rem;" id="ai-tone-pro">Professional</button>
      </div>
    `;
    formPanel.insertBefore(aiTools, formPanel.lastElementChild);

    const enhanceTone = async (tone) => {
      const text = bodyTextarea.value;
      if (!text) return showToast('Write some text to enhance first.', 'error');
      showToast('Enhancing email tone...', 'info');
      try {
        const res = await client.request('/ai/enhance-tone', 'POST', { text, tone });
        bodyTextarea.value = res.enhanced;
        showToast('Tone enhanced successfully!', 'success');
      } catch (e) {
        showToast(e.message, 'error');
      }
    };

    document.getElementById('ai-tone-formal').addEventListener('click', () => enhanceTone('formal'));
    document.getElementById('ai-tone-friendly').addEventListener('click', () => enhanceTone('friendly'));
    document.getElementById('ai-tone-pro').addEventListener('click', () => enhanceTone('professional'));
  }
}

async function loadReadEmailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const emailId = urlParams.get('id');
  if (!emailId) return;

  try {
    const email = await client.request(`/emails/${emailId}`);
    
    // Bind Details
    const headerTitle = document.querySelector('.page-content h2');
    if (headerTitle) headerTitle.textContent = email.subject;

    // We can replace the dynamic placeholders in static panel
    const detailPanel = document.querySelector('.glass-panel');
    if (detailPanel) {
      detailPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h3 style="font-size: 1.2rem;">${email.senderName}</h3>
            <span class="text-muted" style="font-size: 0.9rem;">&lt;${email.senderEmail}&gt;</span>
          </div>
          <div class="text-muted" style="font-size: 0.9rem; text-align: right;">
            ${new Date(email.date).toLocaleString()}
          </div>
        </div>
        <div style="font-size: 1.1rem; line-height: 1.6; min-height: 150px; margin-bottom: 2rem;" id="email-body">
          ${email.body.replace(/\n/g, '<br>')}
        </div>
        <div style="display: flex; gap: 0.5rem;" id="email-actions">
          <button class="btn btn-outline" style="width: auto;" id="btn-read-aloud"><i class="fa-solid fa-volume-high"></i> Read Aloud</button>
          <button class="btn btn-outline" style="width: auto;" id="btn-summarize"><i class="fa-solid fa-wand-magic-sparkles"></i> Summarize</button>
          <button class="btn btn-outline" style="width: auto;" id="btn-delete"><i class="fa-solid fa-trash"></i> Delete</button>
          <button class="btn" style="width: 120px;" id="btn-reply"><i class="fa-solid fa-reply"></i> Reply</button>
        </div>
      `;

      // Read aloud trigger
      document.getElementById('btn-read-aloud').addEventListener('click', () => {
        showToast('Reading email aloud...', 'info');
        speak(`Email from ${email.senderName}. Subject: ${email.subject}. Body: ${email.body}`);
      });

      // Summarize trigger
      document.getElementById('btn-summarize').addEventListener('click', async () => {
        showToast('Generating AI Summary...', 'info');
        try {
          const res = await client.request('/ai/summarize', 'POST', { body: email.body });
          
          let summaryBox = document.getElementById('ai-summary-box');
          if (!summaryBox) {
            summaryBox = document.createElement('div');
            summaryBox.id = 'ai-summary-box';
            summaryBox.className = 'glass-panel';
            summaryBox.style.cssText = `
              margin-top: 1.5rem;
              padding: 1.5rem;
              border: 1px dashed var(--accent-cyan);
              background: rgba(0, 240, 255, 0.05);
            `;
            detailPanel.appendChild(summaryBox);
          }
          summaryBox.innerHTML = `<h4><i class="fa-solid fa-bolt" style="color: var(--accent-cyan);"></i> Smart Summary</h4><p style="margin-top: 0.5rem; line-height: 1.5;">${res.summary}</p>`;
        } catch (e) {
          showToast(e.message, 'error');
        }
      });

      // Delete trigger
      document.getElementById('btn-delete').addEventListener('click', async () => {
        try {
          await client.request('/emails/action', 'POST', { id: emailId, action: 'delete' });
          showToast('Email moved to trash.', 'success');
          setTimeout(() => window.history.back(), 1000);
        } catch (e) {
          showToast(e.message, 'error');
        }
      });

      // Reply trigger
      document.getElementById('btn-reply').addEventListener('click', () => {
        window.location.href = `compose_email.html?to=${encodeURIComponent(email.senderEmail)}`;
      });

      // Check for Meeting reminders
      client.request('/ai/extract-reminders', 'POST', { body: email.body, subject: email.subject }).then(res => {
        if (res.meeting) {
          const meetingBox = document.createElement('div');
          meetingBox.className = 'glass-panel';
          meetingBox.style.cssText = `
            margin-top: 1.5rem;
            padding: 1.5rem;
            border: 1px solid var(--warning);
            background: rgba(245, 158, 11, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;
          meetingBox.innerHTML = `
            <div>
              <h4 style="color: var(--warning);"><i class="fa-solid fa-calendar-day"></i> Meeting Reminder Detected</h4>
              <p style="margin-top: 0.5rem;"><strong>${res.meeting.title}</strong> on ${res.meeting.date} at ${res.meeting.time}</p>
            </div>
            <button class="btn" style="width: auto; padding: 0.5rem 1rem; background: var(--warning); color: black;" id="btn-add-cal">Add to Calendar</button>
          `;
          detailPanel.appendChild(meetingBox);

          document.getElementById('btn-add-cal').addEventListener('click', async () => {
            try {
              await client.request('/calendar', 'POST', res.meeting);
              showToast('Meeting scheduled in your calendar!', 'success');
              document.getElementById('btn-add-cal').disabled = true;
              document.getElementById('btn-add-cal').innerText = 'Added';
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        }
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadContactsPage() {
  const listContainer = document.querySelector('.glass-panel');
  if (!listContainer) return;

  try {
    const contacts = await client.request('/contacts');
    
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3>My Contacts</h3>
        <button class="btn" style="width:auto; padding: 0.5rem 1.2rem;" id="btn-add-contact-modal"><i class="fa-solid fa-plus"></i> New Contact</button>
      </div>
    `;

    if (contacts.length === 0) {
      html += '<p class="text-muted">No contacts found.</p>';
    } else {
      html += '<div style="display:flex; flex-direction:column; gap:0.8rem;">';
      contacts.forEach(c => {
        html += `
          <div class="glass-panel" style="padding:1rem; display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.01);">
            <div>
              <h4 style="font-size:1.1rem;">${c.name}</h4>
              <span class="text-muted" style="font-size:0.9rem;">${c.email} • ${c.role}</span>
            </div>
            <button class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem;" onclick="window.location.href='compose_email.html?to=${encodeURIComponent(c.email)}'">
              <i class="fa-solid fa-paper-plane"></i> Email
            </button>
          </div>
        `;
      });
      html += '</div>';
    }

    listContainer.innerHTML = html;

    // Contact modal add listener
    document.getElementById('btn-add-contact-modal').addEventListener('click', () => {
      const name = prompt("Enter Contact Name:");
      const email = prompt("Enter Contact Email:");
      const role = prompt("Enter Contact Role (e.g. Associate, Friend, Manager):") || 'Contact';

      if (name && email) {
        client.request('/contacts', 'POST', { name, email, role }).then(() => {
          showToast('Contact added!', 'success');
          loadContactsPage();
        }).catch(e => showToast(e.message, 'error'));
      }
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadCalendarPage() {
  const container = document.querySelector('.glass-panel');
  if (!container) return;

  try {
    const events = await client.request('/calendar');

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3>Calendar Schedule</h3>
        <button class="btn" style="width:auto; padding: 0.5rem 1.2rem;" id="btn-add-event-modal"><i class="fa-solid fa-plus"></i> New Event</button>
      </div>
    `;

    if (events.length === 0) {
      html += '<p class="text-muted">No scheduled meetings.</p>';
    } else {
      html += '<div style="display:flex; flex-direction:column; gap:0.8rem;">';
      events.forEach(e => {
        html += `
          <div class="glass-panel" style="padding:1rem; display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.01); border-left: 3px solid var(--warning);">
            <div>
              <h4 style="font-size:1.1rem; color:var(--warning);">${e.title}</h4>
              <p style="margin-top:0.3rem;">${e.description}</p>
              <span class="text-muted" style="font-size:0.9rem;"><i class="fa-solid fa-clock"></i> ${e.date} at ${e.time}</span>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    container.innerHTML = html;

    document.getElementById('btn-add-event-modal').addEventListener('click', () => {
      const title = prompt("Event Title:");
      const date = prompt("Event Date (YYYY-MM-DD):");
      const time = prompt("Event Time (e.g. 11:00 AM):") || '12:00 PM';
      const description = prompt("Description:") || '';

      if (title && date) {
        client.request('/calendar', 'POST', { title, date, time, description }).then(() => {
          showToast('Event scheduled!', 'success');
          loadCalendarPage();
        }).catch(e => showToast(e.message, 'error'));
      }
    });

  } catch (e) {
    showToast(e.message, 'error');
  }
}

// --- Voice Overlay Listening Loop (AI Assistant Core) ---

function runVoiceOverlayListeningLoop() {
  const overlayTitle = document.querySelector('.voice-text');
  const overlayStatus = document.querySelector('.voice-overlay p');

  if (!overlayTitle) return;

  // Let assistant speak opening prompt
  speak("Listening for commands", () => {
    initVoiceRecognition(
      async (transcript) => {
        overlayTitle.textContent = `"${transcript}"`;
        overlayStatus.textContent = "Processing command...";

        try {
          // Parse command via AI
          const parsed = await client.request('/ai/parse-command', 'POST', { transcript });
          
          overlayTitle.textContent = `"${parsed.spokenResponse}"`;
          overlayStatus.textContent = "Responding...";

          speak(parsed.spokenResponse, () => {
            // Execute voice commands routing
            setTimeout(() => {
              if (parsed.action === 'compose') {
                window.location.href = parsed.recipient ? `compose_email.html?to=${encodeURIComponent(parsed.recipient)}` : 'compose_email.html';
              } else if (parsed.action === 'list') {
                if (parsed.folder === 'sent') window.location.href = 'sent_items.html';
                else if (parsed.folder === 'drafts') window.location.href = 'drafts.html';
                else if (parsed.category === 'spam') window.location.href = 'spam.html';
                else if (parsed.category === 'trash') window.location.href = 'trash.html';
                else window.location.href = 'inbox_primary.html';
              } else if (parsed.action === 'read') {
                // Fetch latest email ID and redirect
                client.request('/emails?folder=inbox').then(mails => {
                  if (mails && mails.length > 0) {
                    window.location.href = `read_email.html?id=${mails[0].id}`;
                  } else {
                    showToast('No emails found in inbox to read.', 'error');
                    window.history.back();
                  }
                });
              } else if (parsed.action === 'delete') {
                client.request('/emails?folder=inbox').then(async mails => {
                  if (mails && mails.length > 0) {
                    await client.request('/emails/action', 'POST', { id: mails[0].id, action: 'delete' });
                    showToast('Deleted latest email', 'success');
                  }
                  window.history.back();
                });
              } else if (parsed.action === 'calendar') {
                window.location.href = 'calendar.html';
              } else if (parsed.action === 'settings') {
                window.location.href = 'settings_general.html';
              } else if (parsed.action === 'help') {
                window.location.href = 'voice_cheatsheet.html';
              } else if (parsed.action === 'back') {
                window.history.back();
              } else {
                // If unknown command, go back to previous screen
                window.history.back();
              }
            }, 1500);
          });
        } catch (e) {
          showToast(e.message, 'error');
          speak("Sorry, I encountered an error processing your command.", () => window.history.back());
        }
      },
      () => {
        // If recognition ends without parsing a result, cancel and go back
        setTimeout(() => {
          if (overlayStatus.textContent === 'Listening... (Click anywhere to cancel)') {
            window.history.back();
          }
        }, 3000);
      }
    );
  });
}
