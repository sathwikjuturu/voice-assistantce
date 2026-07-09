/**
 * VoiceMail AI - Comprehensive Voice Engine
 * 
 * Features:
 * - Wake word detection ("Hey Mail" / "Hey Mail Assistant")
 * - Continuous listening mode with auto-restart
 * - Full TTS feedback for every action and navigation
 * - Smart voice command routing across all pages
 * - Inline voice form filling (to, subject, body)
 * - Command confirmation for destructive actions
 * - Visual waveform indicator
 * - Context-aware page voice commands
 */

(function() {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────────
  const WAKE_WORDS = ['hey mail', 'hey mail assistant', 'hey voicemail', 'voice assistant'];
  const VOICE_ENGINE_KEY = 'vm_voice_engine_enabled';
  const CONTINUOUS_KEY   = 'vm_continuous_listening';

  // ─── State ────────────────────────────────────────────────────────────────────
  let engine = {
    recognition: null,
    isListening: false,
    isContinuous: JSON.parse(localStorage.getItem(CONTINUOUS_KEY) || 'false'),
    isWakeWordMode: false,
    isSpeaking: false,
    lastTranscript: '',
    confirmPending: null,  // { action, callback }
    currentPage: window.location.pathname.split('/').pop() || 'index.html'
  };

  // ─── TTS (Text-to-Speech) ─────────────────────────────────────────────────────
  function tts(text, onDone = null) {
    if (!('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }
    window.speechSynthesis.cancel();
    engine.isSpeaking = true;

    const settings = getSettings();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = parseFloat(settings.voiceSpeed) || 1.0;
    utter.lang = settings.voiceLanguage || 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith('en'));
    if (match) utter.voice = match;

    utter.onend = () => {
      engine.isSpeaking = false;
      if (onDone) onDone();
    };
    utter.onerror = () => {
      engine.isSpeaking = false;
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utter);
  }

  function getSettings() {
    try {
      const db = JSON.parse(localStorage.getItem('ls_db') || '{}');
      return db.settings || { voiceSpeed: 1.0, voiceLanguage: 'en-US' };
    } catch { return { voiceSpeed: 1.0, voiceLanguage: 'en-US' }; }
  }

  // ─── Visual Indicators ────────────────────────────────────────────────────────
  function updateVoiceBtn(state) {
    const btn = document.getElementById('voice-assistant-btn');
    if (!btn) return;

    if (state === 'listening') {
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btn.style.boxShadow  = '0 0 30px rgba(16,185,129,0.8)';
      btn.title = 'Voice Active – Listening...';
    } else if (state === 'continuous') {
      btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      btn.style.boxShadow  = '0 0 30px rgba(245,158,11,0.7)';
      btn.title = 'Continuous Mode – Say "Hey Mail" to command';
    } else {
      btn.style.background = '';
      btn.style.boxShadow  = '';
      btn.title = 'Click to activate voice assistant';
    }
  }

  function showVoiceBanner(message, type = 'listening') {
    let banner = document.getElementById('vm-voice-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'vm-voice-banner';
      banner.style.cssText = `
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10,15,30,0.96);
        border: 1.5px solid var(--accent-cyan, #00f0ff);
        border-radius: 50px;
        padding: 0.55rem 1.4rem;
        color: white;
        font-family: 'Outfit', sans-serif;
        font-size: 0.92rem;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        box-shadow: 0 8px 32px rgba(0,240,255,0.25);
        backdrop-filter: blur(12px);
        transition: opacity 0.3s;
        pointer-events: none;
      `;
      document.body.appendChild(banner);
    }

    const colors = {
      listening: '#00f0ff',
      processing: '#f59e0b',
      success: '#10b981',
      error: '#ef4444',
      confirm: '#a855f7'
    };
    const icons = {
      listening: 'fa-microphone',
      processing: 'fa-spinner fa-spin',
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      confirm: 'fa-triangle-exclamation'
    };

    const color = colors[type] || '#00f0ff';
    const icon  = icons[type]  || 'fa-microphone';

    banner.innerHTML = `
      <i class="fa-solid ${icon}" style="color:${color}"></i>
      <span style="color:${color}">${message}</span>
    `;
    banner.style.opacity = '1';
    banner.style.borderColor = color;
    banner.style.boxShadow = `0 8px 32px ${color}33`;
  }

  function hideVoiceBanner() {
    const banner = document.getElementById('vm-voice-banner');
    if (banner) {
      banner.style.opacity = '0';
      setTimeout(() => { if (banner) banner.style.opacity = '1'; }, 3000);
    }
  }

  // ─── Recognition Setup ────────────────────────────────────────────────────────
  function createRecognition(continuous = false) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.continuous      = continuous;
    rec.interimResults  = true;
    rec.lang            = getSettings().voiceLanguage || 'en-US';
    rec.maxAlternatives = 1;
    return rec;
  }

  // ─── Main Voice Activation (single command) ────────────────────────────────────
  function activateVoice() {
    if (engine.isListening) return;
    engine.isListening = true;

    updateVoiceBtn('listening');
    showVoiceBanner('Listening… speak your command', 'listening');
    tts('Listening', () => {
      const rec = createRecognition(false);
      if (!rec) {
        engine.isListening = false;
        updateVoiceBtn('idle');
        showToastSafe('Speech recognition not supported in this browser.', 'error');
        return;
      }

      engine.recognition = rec;
      let finalTranscript = '';

      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim = event.results[i][0].transcript;
          }
        }
        if (interim) showVoiceBanner(`"${interim}"`, 'listening');
      };

      rec.onend = () => {
        engine.isListening = false;
        if (finalTranscript.trim()) {
          showVoiceBanner(`Processing: "${finalTranscript}"`, 'processing');
          handleVoiceCommand(finalTranscript.trim());
        } else {
          updateVoiceBtn(engine.isContinuous ? 'continuous' : 'idle');
          showVoiceBanner('No command detected', 'error');
          setTimeout(hideVoiceBanner, 2000);
          if (engine.isContinuous) startContinuousMode();
        }
      };

      rec.onerror = (e) => {
        engine.isListening = false;
        updateVoiceBtn(engine.isContinuous ? 'continuous' : 'idle');
        if (e.error !== 'no-speech') {
          showVoiceBanner(`Mic error: ${e.error}`, 'error');
        }
        if (engine.isContinuous) setTimeout(startContinuousMode, 2000);
      };

      rec.start();
    });
  }

  // ─── Continuous / Wake Word Mode ──────────────────────────────────────────────
  function startContinuousMode() {
    if (engine.isListening || engine.isSpeaking) return;

    engine.isWakeWordMode = true;
    updateVoiceBtn('continuous');
    showVoiceBanner('Continuous Mode – Say "Hey Mail" to command', 'listening');

    const rec = createRecognition(true);
    if (!rec) return;

    engine.recognition = rec;
    let finalBuffer = '';

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalBuffer += event.results[i][0].transcript.toLowerCase() + ' ';
        }
      }

      // Detect wake word
      for (const ww of WAKE_WORDS) {
        if (finalBuffer.includes(ww)) {
          const afterWake = finalBuffer.split(ww).pop().trim();
          finalBuffer = '';
          if (rec) { try { rec.stop(); } catch (_) {} }
          engine.isWakeWordMode = false;

          if (afterWake.length > 3) {
            // Command embedded in wake phrase: "Hey Mail compose email to John"
            showVoiceBanner(`Command: "${afterWake}"`, 'processing');
            handleVoiceCommand(afterWake);
          } else {
            // Wake word only – start single command
            tts('Yes, how can I help?', () => activateVoice());
          }
          return;
        }
      }

      // Keep buffer short
      if (finalBuffer.split(' ').length > 20) finalBuffer = finalBuffer.split(' ').slice(-10).join(' ') + ' ';
    };

    rec.onend = () => {
      if (engine.isContinuous && !engine.isListening) {
        setTimeout(startContinuousMode, 1500);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Continuous mode error:', e.error);
      }
      if (engine.isContinuous) setTimeout(startContinuousMode, 2000);
    };

    try { rec.start(); } catch (_) {}
  }

  function stopContinuousMode() {
    engine.isContinuous = false;
    engine.isWakeWordMode = false;
    localStorage.setItem(CONTINUOUS_KEY, 'false');
    if (engine.recognition) { try { engine.recognition.stop(); } catch (_) {} }
    updateVoiceBtn('idle');
    showVoiceBanner('Continuous mode off', 'error');
    setTimeout(hideVoiceBanner, 2500);
  }

  // ─── Command Confirmation (for destructive actions) ───────────────────────────
  function requestConfirmation(message, onConfirm) {
    engine.confirmPending = { onConfirm };
    tts(`${message}. Say YES to confirm or NO to cancel.`);
    showVoiceBanner(`${message} — say YES or NO`, 'confirm');

    // Listen for yes/no
    const rec = createRecognition(false);
    if (!rec) return;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      if (transcript.includes('yes') || transcript.includes('confirm') || transcript.includes('ok')) {
        engine.confirmPending = null;
        tts('Confirmed.', onConfirm);
      } else {
        engine.confirmPending = null;
        tts('Cancelled.');
        showVoiceBanner('Action cancelled', 'error');
        setTimeout(hideVoiceBanner, 2000);
      }
    };

    rec.onerror = () => {
      engine.confirmPending = null;
      showVoiceBanner('Could not hear confirmation', 'error');
    };

    rec.onend = () => {};
    rec.start();
  }

  // ─── Core Command Handler ─────────────────────────────────────────────────────
  async function handleVoiceCommand(transcript) {
    const lower = transcript.toLowerCase();
    const page  = engine.currentPage;

    // ── Toggle continuous mode ────────────────────────────────────────────────
    if (lower.includes('stop continuous') || lower.includes('stop listening') || lower.includes('disable continuous')) {
      stopContinuousMode();
      return;
    }

    if (lower.includes('enable continuous') || lower.includes('start continuous') || lower.includes('always listen')) {
      engine.isContinuous = true;
      localStorage.setItem(CONTINUOUS_KEY, 'true');
      tts('Continuous listening mode enabled. Say Hey Mail to command me.');
      startContinuousMode();
      return;
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    if (lower.includes('logout') || lower.includes('log out') || lower.includes('sign out')) {
      requestConfirmation('Are you sure you want to log out?', () => {
        tts('Logging out.', () => {
          localStorage.removeItem('voicemail_jwt');
          localStorage.removeItem('voicemail_user');
          localStorage.removeItem('ls_current_user');
          window.location.href = 'login.html';
        });
      });
      return;
    }

    // ── Login page voice ──────────────────────────────────────────────────────
    if (page === 'login.html') {
      await handleLoginVoice(lower, transcript);
      return;
    }

    // ── Signup page voice ─────────────────────────────────────────────────────
    if (page === 'signup.html') {
      await handleSignupVoice(lower, transcript);
      return;
    }

    // ── Compose page context-aware voice ──────────────────────────────────────
    if (page === 'compose_email.html') {
      const handled = await handleComposeVoice(lower, transcript);
      if (handled) return;
    }

    // ── Read email page ───────────────────────────────────────────────────────
    if (page === 'read_email.html') {
      const handled = await handleReadEmailVoice(lower, transcript);
      if (handled) return;
    }

    // ── Calendar page voice ───────────────────────────────────────────────────
    if (page === 'calendar.html') {
      const handled = await handleCalendarVoice(lower, transcript);
      if (handled) return;
    }

    // ── Contacts page voice ───────────────────────────────────────────────────
    if (page === 'contacts.html') {
      const handled = handleContactsVoice(lower);
      if (handled) return;
    }

    // ── Settings page voice ───────────────────────────────────────────────────
    if (page.startsWith('settings')) {
      const handled = handleSettingsVoice(lower);
      if (handled) return;
    }

    // ── Global navigation commands ────────────────────────────────────────────
    await handleGlobalNavigation(lower, transcript);
  }

  // ─── Login Page Voice Handler ──────────────────────────────────────────────────
  async function handleLoginVoice(lower, transcript) {
    const emailInput = document.querySelector('input[type="email"]');
    const passInput  = document.querySelector('input[type="password"]');

    if (lower.startsWith('email ') || lower.startsWith('my email is ')) {
      const val = lower.replace(/^(email |my email is )/, '').trim()
        .replace(/\s*at\s*/g, '@').replace(/\s*dot\s*/g, '.').replace(/\s+/g, '');
      if (emailInput) { emailInput.value = val; tts(`Email set to ${val}`); }
      return;
    }

    if (lower.startsWith('password ') || lower.startsWith('my password is ')) {
      const val = transcript.replace(/^(password |my password is )/i, '').trim();
      if (passInput) { passInput.value = val; tts('Password entered.'); }
      return;
    }

    if (lower.includes('login') || lower.includes('sign in') || lower.includes('submit')) {
      document.querySelector('.btn')?.click();
      tts('Logging in.');
      return;
    }

    if (lower.includes('sign up') || lower.includes('create account') || lower.includes('register')) {
      tts('Opening signup page.', () => window.location.href = 'signup.html');
      return;
    }

    if (lower.includes('forgot password') || lower.includes('reset password')) {
      tts('Opening forgot password page.', () => window.location.href = 'forgot_password.html');
      return;
    }

    tts('On the login page. Say "email [address]", "password [password]", then "login".');
  }

  // ─── Signup Page Voice Handler ────────────────────────────────────────────────
  async function handleSignupVoice(lower, transcript) {
    const nameInput  = document.querySelector('input[placeholder="Full Name"]');
    const emailInput = document.querySelector('input[type="email"]');
    const passInput  = document.querySelector('input[type="password"]');

    if (lower.startsWith('name ') || lower.startsWith('my name is ')) {
      const val = transcript.replace(/^(name |my name is )/i, '').trim();
      if (nameInput) { nameInput.value = val; tts(`Name set to ${val}`); }
      return;
    }

    if (lower.startsWith('email ') || lower.startsWith('my email is ')) {
      const val = lower.replace(/^(email |my email is )/, '').trim()
        .replace(/\s*at\s*/g, '@').replace(/\s*dot\s*/g, '.').replace(/\s+/g, '');
      if (emailInput) { emailInput.value = val; tts(`Email set to ${val}`); }
      return;
    }

    if (lower.startsWith('password ') || lower.startsWith('my password is ')) {
      const val = transcript.replace(/^(password |my password is )/i, '').trim();
      if (passInput) { passInput.value = val; tts('Password entered.'); }
      return;
    }

    if (lower.includes('sign up') || lower.includes('register') || lower.includes('submit')) {
      document.querySelector('.btn')?.click();
      tts('Creating your account.');
      return;
    }

    tts('On signup. Say "name [name]", "email [address]", "password [password]", then "sign up".');
  }

  // ─── Compose Page Voice Handler ───────────────────────────────────────────────
  async function handleComposeVoice(lower, transcript) {
    const toInput      = document.querySelector('input[type="email"]');
    const subjectInput = document.querySelector('input[placeholder="Subject:"]');
    const bodyTA       = document.querySelector('textarea');

    if (lower.startsWith('to ') || lower.startsWith('send to ')) {
      let email = lower.replace(/^(to |send to )/, '').trim()
        .replace(/\s*at\s*/g, '@').replace(/\s*dot\s*/g, '.').replace(/\s+/g, '');
      if (toInput) {
        toInput.value = email;
        tts(`Recipient set to ${email}`);
        showVoiceBanner(`To: ${email}`, 'success');
        setTimeout(hideVoiceBanner, 3000);
      }
      return true;
    }

    if (lower.startsWith('subject ')) {
      const subject = transcript.substring(8).trim();
      if (subjectInput) {
        subjectInput.value = subject;
        tts(`Subject set to: ${subject}`);
        showVoiceBanner(`Subject: ${subject}`, 'success');
        setTimeout(hideVoiceBanner, 3000);
      }
      return true;
    }

    if (lower.startsWith('body ') || lower.startsWith('message ') || lower.startsWith('write ')) {
      const body = transcript.replace(/^(body |message |write )/i, '').trim();
      if (bodyTA) {
        bodyTA.value += (bodyTA.value ? ' ' : '') + body;
        tts('Body updated.');
      }
      return true;
    }

    if (lower.includes('clear to') || lower.includes('clear recipient')) {
      if (toInput) { toInput.value = ''; tts('Recipient cleared.'); }
      return true;
    }

    if (lower.includes('clear subject')) {
      if (subjectInput) { subjectInput.value = ''; tts('Subject cleared.'); }
      return true;
    }

    if (lower.includes('clear body') || lower.includes('clear message') || lower.includes('clear email')) {
      if (bodyTA) {
        requestConfirmation('Clear the email body?', () => {
          bodyTA.value = '';
          tts('Body cleared.');
        });
      }
      return true;
    }

    if (lower.includes('formal') || lower.includes('make it formal')) {
      document.getElementById('ai-tone-formal')?.click();
      tts('Applying formal tone.');
      return true;
    }

    if (lower.includes('friendly') || lower.includes('make it friendly')) {
      document.getElementById('ai-tone-friendly')?.click();
      tts('Applying friendly tone.');
      return true;
    }

    if (lower.includes('professional') || lower.includes('make it professional')) {
      document.getElementById('ai-tone-pro')?.click();
      tts('Applying professional tone.');
      return true;
    }

    if (lower.includes('send email') || lower.includes('send it') || lower.includes('send now')) {
      const to = toInput?.value.trim();
      if (!to) { tts('Please set a recipient first. Say "to [email address]".'); return true; }
      requestConfirmation(`Send this email to ${to}?`, () => {
        document.querySelector('.btn:not(.btn-outline)')?.click();
        tts('Email sent.');
      });
      return true;
    }

    if (lower.includes('save draft') || lower.includes('draft')) {
      tts('Saving as draft.');
      const to = toInput?.value.trim() || '';
      const subject = subjectInput?.value.trim() || '';
      const body = bodyTA?.value || '';
      if (window.client) {
        window.client.request('/emails/draft', 'POST', { to, subject, body }).then(() => {
          tts('Saved as draft. Going back.', () => window.location.href = 'drafts.html');
        });
      }
      return true;
    }

    if (lower.includes('what should i say') || lower.includes('help me write') || lower.includes('suggest')) {
      tts('Start by saying "to [email]", then "subject [your subject]", then "body [your message]", and finally "send email" when you are ready.');
      return true;
    }

    return false;
  }

  // ─── Read Email Page Voice Handler ────────────────────────────────────────────
  async function handleReadEmailVoice(lower) {
    if (lower.includes('read aloud') || lower.includes('read email') || lower.includes('read it') || lower.includes('play')) {
      document.getElementById('btn-read-aloud')?.click();
      return true;
    }

    if (lower.includes('stop reading') || lower.includes('stop speaking') || lower.includes('quiet')) {
      window.speechSynthesis.cancel();
      tts('Stopped.');
      return true;
    }

    if (lower.includes('summarize') || lower.includes('summary') || lower.includes('brief')) {
      document.getElementById('btn-summarize')?.click();
      tts('Generating smart summary.');
      return true;
    }

    if (lower.includes('delete') || lower.includes('trash')) {
      requestConfirmation('Delete this email?', () => {
        document.getElementById('btn-delete')?.click();
      });
      return true;
    }

    if (lower.includes('reply') || lower.includes('respond')) {
      document.getElementById('btn-reply')?.click();
      tts('Opening reply composer.');
      return true;
    }

    if (lower.includes('star') || lower.includes('mark important') || lower.includes('flag')) {
      tts('Starring email.');
      const emailId = new URLSearchParams(window.location.search).get('id');
      if (emailId && window.client) {
        window.client.request('/emails/action', 'POST', { id: emailId, action: 'star' }).then(() => {
          tts('Email starred.');
        });
      }
      return true;
    }

    if (lower.includes('add to calendar') || lower.includes('schedule meeting')) {
      document.getElementById('btn-add-cal')?.click();
      tts('Adding meeting to calendar.');
      return true;
    }

    if (lower.includes('forward')) {
      const emailId = new URLSearchParams(window.location.search).get('id');
      if (emailId) {
        tts('Opening forward page.', () => window.location.href = `forward_email.html?id=${emailId}`);
      }
      return true;
    }

    return false;
  }

  // ─── Calendar Page Voice Handler ──────────────────────────────────────────────
  async function handleCalendarVoice(lower, transcript) {
    if (lower.includes('add event') || lower.includes('new event') || lower.includes('schedule')) {
      // Voice-drive event creation
      tts('What is the event title?', () => {
        const rec = createRecognition(false);
        if (!rec) return;
        rec.onresult = (event) => {
          const title = event.results[0][0].transcript.trim();
          tts(`Event title is "${title}". What date? Say in format like May 31 or 2026 dash 05 dash 31.`, () => {
            const rec2 = createRecognition(false);
            if (!rec2) return;
            rec2.onresult = (event2) => {
              let dateRaw = event2.results[0][0].transcript.trim().toLowerCase();
              // Parse simple voice date
              let date = new Date().toISOString().split('T')[0];
              if (dateRaw.includes('tomorrow')) {
                const d = new Date(); d.setDate(d.getDate() + 1);
                date = d.toISOString().split('T')[0];
              } else {
                const nums = dateRaw.match(/\d+/g);
                if (nums && nums.length >= 3) date = `${nums[0]}-${String(nums[1]).padStart(2,'0')}-${String(nums[2]).padStart(2,'0')}`;
              }
              tts(`Date set to ${date}. What time?`, () => {
                const rec3 = createRecognition(false);
                if (!rec3) return;
                rec3.onresult = (event3) => {
                  const time = event3.results[0][0].transcript.trim();
                  if (window.client) {
                    window.client.request('/calendar', 'POST', { title, date, time, description: '' }).then(() => {
                      tts(`Event "${title}" scheduled on ${date} at ${time}.`);
                      loadCalendarPage?.();
                    });
                  }
                };
                rec3.start();
              });
            };
            rec2.start();
          });
        };
        rec.start();
      });
      return true;
    }
    return false;
  }

  // ─── Contacts Page Voice Handler ──────────────────────────────────────────────
  function handleContactsVoice(lower) {
    if (lower.includes('email') && lower.includes('contact')) {
      const m = lower.match(/email (?:to )?(.+)/);
      if (m) {
        const name = m[1].trim();
        tts(`Opening compose to ${name}.`, () => {
          window.location.href = `compose_email.html?to=${encodeURIComponent(name)}`;
        });
        return true;
      }
    }

    if (lower.includes('add contact') || lower.includes('new contact')) {
      document.getElementById('btn-add-contact-modal')?.click();
      tts('Adding a new contact.');
      return true;
    }

    return false;
  }

  // ─── Settings Page Voice Handler ──────────────────────────────────────────────
  function handleSettingsVoice(lower) {
    if (lower.includes('speed') || lower.includes('voice speed') || lower.includes('faster') || lower.includes('slower')) {
      const db = JSON.parse(localStorage.getItem('ls_db') || '{}');
      if (!db.settings) db.settings = {};
      if (lower.includes('faster') || lower.includes('fast')) {
        db.settings.voiceSpeed = Math.min(2.0, (db.settings.voiceSpeed || 1.0) + 0.25);
        tts(`Voice speed increased to ${db.settings.voiceSpeed}`);
      } else if (lower.includes('slower') || lower.includes('slow')) {
        db.settings.voiceSpeed = Math.max(0.5, (db.settings.voiceSpeed || 1.0) - 0.25);
        tts(`Voice speed decreased to ${db.settings.voiceSpeed}`);
      }
      localStorage.setItem('ls_db', JSON.stringify(db));
      return true;
    }

    if (lower.includes('dark mode')) {
      tts('Dark mode is already active.');
      return true;
    }

    return false;
  }

  // ─── Global Navigation Commands ───────────────────────────────────────────────
  async function handleGlobalNavigation(lower, transcript) {
    // Navigation targets
    const routes = {
      dashboard:    'dashboard.html',
      home:         'dashboard.html',
      inbox:        'inbox_primary.html',
      'primary inbox': 'inbox_primary.html',
      promotions:   'inbox_promotions.html',
      social:       'inbox_social.html',
      sent:         'sent_items.html',
      'sent mail':  'sent_items.html',
      drafts:       'drafts.html',
      spam:         'spam.html',
      trash:        'trash.html',
      'deleted':    'trash.html',
      contacts:     'contacts.html',
      calendar:     'calendar.html',
      settings:     'settings_general.html',
      'general settings': 'settings_general.html',
      'voice settings': 'settings_voice.html',
      'notification settings': 'settings_notifications.html',
      notifications: 'notifications.html',
      profile:      'profile.html',
      help:         'help.html',
      'voice help':  'voice_cheatsheet.html',
      cheatsheet:   'voice_cheatsheet.html',
      security:     'security.html',
      storage:      'storage.html',
      theme:        'theme.html',
      signature:    'signature.html',
      search:       'search.html',
      analytics:    'dashboard.html',
    };

    for (const [keyword, dest] of Object.entries(routes)) {
      if (lower.includes(keyword)) {
        if (dest !== engine.currentPage) {
          tts(`Opening ${keyword}.`, () => window.location.href = dest);
        } else {
          tts(`You are already on the ${keyword} page.`);
        }
        return;
      }
    }

    // Compose commands
    if (lower.includes('compose') || lower.includes('write email') || lower.includes('new email')) {
      const m = lower.match(/(?:to|for)\s+([\w\s@.]+)/);
      const dest = m ? `compose_email.html?to=${encodeURIComponent(m[1].trim())}` : 'compose_email.html';
      tts(m ? `Composing email to ${m[1].trim()}.` : 'Opening email composer.', () => window.location.href = dest);
      return;
    }

    // Read latest
    if (lower.includes('read latest') || lower.includes('read last') || lower.includes('open latest') || lower.includes('latest email')) {
      const mails = await window.client?.request('/emails?folder=inbox') || [];
      if (mails.length > 0) {
        const latest = mails[0];
        tts(`Opening email from ${latest.senderName}. Subject: ${latest.subject}.`, () => {
          window.location.href = `read_email.html?id=${latest.id || latest._id}`;
        });
      } else {
        tts('Your inbox is empty.');
      }
      return;
    }

    // Delete latest
    if (lower.includes('delete latest') || lower.includes('delete last email')) {
      const mails = await window.client?.request('/emails?folder=inbox') || [];
      if (mails.length > 0) {
        const latest = mails[0];
        requestConfirmation(`Delete email from ${latest.senderName}?`, async () => {
          await window.client?.request('/emails/action', 'POST', { id: latest.id || latest._id, action: 'delete' });
          tts('Email deleted.');
        });
      } else {
        tts('No emails to delete.');
      }
      return;
    }

    // Search
    if (lower.includes('search') || lower.includes('find email') || lower.includes('find')) {
      const m = lower.match(/(?:search|find)\s+(?:for|emails?\s+from|from|about)?\s*(.+)/);
      if (m && m[1]) {
        tts(`Searching for ${m[1]}.`, () => window.location.href = `search.html?q=${encodeURIComponent(m[1])}`);
      } else {
        tts('Opening search.', () => window.location.href = 'search.html');
      }
      return;
    }

    // Go back
    if (lower.includes('go back') || lower.includes('back') || lower.includes('previous') || lower.includes('cancel')) {
      tts('Going back.', () => window.history.back());
      return;
    }

    // Read unread count
    if (lower.includes('how many') || lower.includes('unread count') || lower.includes('check inbox')) {
      const mails = await window.client?.request('/emails?folder=inbox') || [];
      const unread = mails.filter(m => !m.isRead).length;
      tts(`You have ${unread} unread email${unread === 1 ? '' : 's'} in your inbox.`);
      return;
    }

    // Help
    if (lower.includes('help') || lower.includes('what can you do') || lower.includes('commands')) {
      tts('You can say: open inbox, compose email, read latest, delete latest, open calendar, open settings, enable continuous, go back, or search for emails.');
      return;
    }

    // Stop speech
    if (lower.includes('stop') || lower.includes('quiet') || lower.includes('silence')) {
      window.speechSynthesis.cancel();
      showVoiceBanner('Speech stopped', 'error');
      setTimeout(hideVoiceBanner, 1500);
      return;
    }

    // Fallback
    tts(`I didn't understand "${transcript}". Try saying "open inbox", "compose email", or "help".`);
  }

  // ─── Toast fallback helper ─────────────────────────────────────────────────────
  function showToastSafe(msg, type = 'info') {
    if (typeof showToast === 'function') showToast(msg, type);
    else console.log(`[VoiceEngine] ${type}: ${msg}`);
  }

  // ─── Wire up global mic button ─────────────────────────────────────────────────
  function wireGlobalMicButton() {
    const btn = document.getElementById('voice-assistant-btn');
    if (!btn) return;

    btn.removeAttribute('onclick');
    btn.addEventListener('click', () => {
      if (engine.isListening) {
        // Stop
        if (engine.recognition) { try { engine.recognition.stop(); } catch (_) {} }
        engine.isListening = false;
        updateVoiceBtn(engine.isContinuous ? 'continuous' : 'idle');
        tts('Stopped.');
        return;
      }

      if (engine.isContinuous && engine.isWakeWordMode) {
        // In continuous mode — click triggers a single command immediately
        if (engine.recognition) { try { engine.recognition.stop(); } catch (_) {} }
        engine.isWakeWordMode = false;
        setTimeout(activateVoice, 300);
        return;
      }

      activateVoice();
    });

    // Long press → toggle continuous mode
    let pressTimer;
    btn.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        if (engine.isContinuous) {
          stopContinuousMode();
        } else {
          engine.isContinuous = true;
          localStorage.setItem(CONTINUOUS_KEY, 'true');
          tts('Continuous listening enabled. Say Hey Mail to activate me.');
          startContinuousMode();
        }
      }, 900);
    });
    btn.addEventListener('mouseup',   () => clearTimeout(pressTimer));
    btn.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    btn.addEventListener('touchend',  () => clearTimeout(pressTimer));

    // Tooltip
    btn.title = 'Click to speak | Long-press for continuous mode | Say "Hey Mail" to wake';
  }

  // ─── Add keyboard shortcut (Alt+V) ───────────────────────────────────────────
  function wireKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        activateVoice();
      }
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        if (engine.isContinuous) {
          stopContinuousMode();
        } else {
          engine.isContinuous = true;
          localStorage.setItem(CONTINUOUS_KEY, 'true');
          startContinuousMode();
        }
      }
    });
  }

  // ─── Voice status bar in sidebar ──────────────────────────────────────────────
  function injectVoiceStatusPanel() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || document.getElementById('vm-voice-status-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'vm-voice-status-panel';
    panel.style.cssText = `
      margin: 1rem;
      padding: 0.8rem 1rem;
      background: rgba(0,240,255,0.04);
      border: 1px solid rgba(0,240,255,0.15);
      border-radius: 12px;
      font-size: 0.8rem;
      color: var(--text-muted, #888);
    `;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
        <i class="fa-solid fa-microphone" style="color:#00f0ff;"></i>
        <strong style="color:white;">Voice Engine</strong>
      </div>
      <div id="vm-status-text">Click mic or press Alt+V</div>
      <div style="display:flex;gap:0.4rem;margin-top:0.6rem;">
        <button id="vm-btn-speak" title="Single command" style="flex:1;padding:0.3rem;border:1px solid rgba(0,240,255,0.3);background:rgba(0,240,255,0.08);border-radius:6px;color:#00f0ff;font-size:0.75rem;cursor:pointer;">
          <i class="fa-solid fa-microphone"></i> Speak
        </button>
        <button id="vm-btn-continuous" title="Continuous mode" style="flex:1;padding:0.3rem;border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.08);border-radius:6px;color:#f59e0b;font-size:0.75rem;cursor:pointer;">
          <i class="fa-solid fa-infinity"></i> Always
        </button>
      </div>
    `;
    sidebar.appendChild(panel);

    document.getElementById('vm-btn-speak').addEventListener('click', activateVoice);
    document.getElementById('vm-btn-continuous').addEventListener('click', () => {
      if (engine.isContinuous) {
        stopContinuousMode();
        document.getElementById('vm-status-text').textContent = 'Continuous mode off';
      } else {
        engine.isContinuous = true;
        localStorage.setItem(CONTINUOUS_KEY, 'true');
        startContinuousMode();
        document.getElementById('vm-status-text').textContent = 'Say "Hey Mail" to command';
      }
    });

    // Update status text periodically
    setInterval(() => {
      const el = document.getElementById('vm-status-text');
      if (!el) return;
      if (engine.isSpeaking) el.textContent = '🔊 Speaking...';
      else if (engine.isListening) el.textContent = '🎙 Listening...';
      else if (engine.isContinuous) el.textContent = '💤 Say "Hey Mail"';
      else el.textContent = 'Alt+V or click mic';
    }, 500);
  }

  // ─── Auto-read new page name on navigation ────────────────────────────────────
  function announcePageLoad() {
    const authPages = ['login.html','signup.html','splash.html','onboarding1.html','onboarding2.html'];
    if (authPages.includes(engine.currentPage)) return;

    const pageNames = {
      'dashboard.html': 'Dashboard overview',
      'inbox_primary.html': 'Primary inbox',
      'inbox_promotions.html': 'Promotions inbox',
      'inbox_social.html': 'Social inbox',
      'compose_email.html': 'Compose email. Say to, subject, and body to fill the form.',
      'sent_items.html': 'Sent mail',
      'drafts.html': 'Drafts',
      'spam.html': 'Spam folder',
      'trash.html': 'Trash',
      'read_email.html': 'Reading email. Say read aloud, reply, delete, summarize, or forward.',
      'contacts.html': 'Contacts',
      'calendar.html': 'Calendar',
      'settings_general.html': 'General settings',
      'settings_voice.html': 'Voice settings',
      'notifications.html': 'Notifications',
      'profile.html': 'Profile',
      'help.html': 'Help',
      'voice_cheatsheet.html': 'Voice command cheatsheet',
      'search.html': 'Search'
    };

    const name = pageNames[engine.currentPage];
    if (name) {
      // Slight delay so DOM settles
      setTimeout(() => tts(name), 800);
    }
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    wireGlobalMicButton();
    wireKeyboardShortcut();
    injectVoiceStatusPanel();
    announcePageLoad();

    // Resume continuous mode if it was enabled
    if (engine.isContinuous) {
      setTimeout(startContinuousMode, 2000);
    }

    // Expose for voice_overlay.html compatibility
    window.__voiceEngine = { activateVoice, startContinuousMode, stopContinuousMode, tts };
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  // Voices load asynchronously in some browsers
  window.speechSynthesis.onvoiceschanged = () => {};

})();
