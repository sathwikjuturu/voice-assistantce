import express from 'express';
import { GoogleGenAI } from '@google/genai';
import Email from '../models/Email.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Initialize Gemini client if API key is provided
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize Gemini API Client:', err.message);
  }
}

// Helper to query Gemini with a prompt
async function queryGemini(prompt, systemInstruction = "") {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });
    return response.text;
  } catch (err) {
    console.error('Gemini API call error:', err.message);
    return null;
  }
}

// 1. Voice Command Parser Endpoint
router.post('/parse-command', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  const lowercaseTranscript = transcript.toLowerCase();
  console.log(`Parsing voice command: "${transcript}"`);

  // Local fallback parsing using regex/keywords (works 100% of the time, zero-dependency)
  let parsed = {
    action: 'unknown',
    recipient: '',
    query: '',
    category: '',
    folder: '',
    spokenResponse: "I didn't quite get that command. Try saying 'inbox', 'compose to David', or 'read latest email'."
  };

  // Heuristics
  if (lowercaseTranscript.includes('compose') || lowercaseTranscript.includes('write') || lowercaseTranscript.includes('new email') || lowercaseTranscript.includes('send email')) {
    parsed.action = 'compose';
    parsed.spokenResponse = "Opening the email composer.";
    
    const match = lowercaseTranscript.match(/(?:to|for)\s+([a-zA-Z0-9\s@.]+)/);
    if (match && match[1]) {
      parsed.recipient = match[1].trim();
      parsed.spokenResponse = `Opening composer to write to ${parsed.recipient}.`;
    }
  } 
  else if (lowercaseTranscript.includes('inbox') || lowercaseTranscript.includes('read unread') || lowercaseTranscript.includes('check emails')) {
    parsed.action = 'list';
    parsed.folder = 'inbox';
    parsed.category = 'primary';
    parsed.spokenResponse = "Navigating to your primary inbox.";
  } 
  else if (lowercaseTranscript.includes('sent')) {
    parsed.action = 'list';
    parsed.folder = 'sent';
    parsed.spokenResponse = "Opening your sent messages.";
  } 
  else if (lowercaseTranscript.includes('draft')) {
    parsed.action = 'list';
    parsed.folder = 'drafts';
    parsed.spokenResponse = "Opening your saved drafts.";
  } 
  else if (lowercaseTranscript.includes('spam')) {
    parsed.action = 'list';
    parsed.category = 'spam';
    parsed.spokenResponse = "Opening spam folder.";
  } 
  else if (lowercaseTranscript.includes('trash') || lowercaseTranscript.includes('deleted')) {
    parsed.action = 'list';
    parsed.category = 'trash';
    parsed.spokenResponse = "Opening your trash folder.";
  } 
  else if (lowercaseTranscript.includes('read latest') || lowercaseTranscript.includes('read last') || lowercaseTranscript.includes('read recent') || lowercaseTranscript.includes('read email')) {
    parsed.action = 'read';
    parsed.spokenResponse = "Opening and reading your latest email.";
  } 
  else if (lowercaseTranscript.includes('delete latest') || lowercaseTranscript.includes('delete last') || lowercaseTranscript.includes('delete email')) {
    parsed.action = 'delete';
    parsed.spokenResponse = "Trashing your latest email.";
  } 
  else if (lowercaseTranscript.includes('search') || lowercaseTranscript.includes('find')) {
    parsed.action = 'search';
    const match = lowercaseTranscript.match(/(?:search|find)\s+(?:for|emails\s+from|from|about)?\s*([a-zA-Z0-9\s@.]+)/);
    if (match && match[1]) {
      parsed.query = match[1].trim();
      parsed.spokenResponse = `Searching your emails for ${parsed.query}.`;
    } else {
      parsed.spokenResponse = "What would you like me to search for?";
    }
  } 
  else if (lowercaseTranscript.includes('calendar') || lowercaseTranscript.includes('meeting') || lowercaseTranscript.includes('schedule')) {
    parsed.action = 'calendar';
    parsed.spokenResponse = "Opening your calendar.";
  } 
  else if (lowercaseTranscript.includes('settings') || lowercaseTranscript.includes('preferences') || lowercaseTranscript.includes('options')) {
    parsed.action = 'settings';
    parsed.spokenResponse = "Opening assistant settings.";
  } 
  else if (lowercaseTranscript.includes('help') || lowercaseTranscript.includes('cheatsheet') || lowercaseTranscript.includes('command list')) {
    parsed.action = 'help';
    parsed.spokenResponse = "Opening voice help and cheat sheet.";
  } 
  else if (lowercaseTranscript.includes('back') || lowercaseTranscript.includes('cancel') || lowercaseTranscript.includes('go back')) {
    parsed.action = 'back';
    parsed.spokenResponse = "Going back.";
  }

  // If Gemini is available, use it for premium natural language parsing
  if (ai) {
    const prompt = `Analyze the following voice command transcript from an email app user: "${transcript}".
Return a JSON object matching this schema. Output ONLY valid JSON:
{
  "action": "compose" | "list" | "read" | "delete" | "search" | "calendar" | "settings" | "help" | "back" | "unknown",
  "recipient": "string or empty if none",
  "query": "search query or empty",
  "category": "primary" | "promotions" | "social" | "spam" | "trash" | "",
  "folder": "inbox" | "sent" | "drafts" | "",
  "spokenResponse": "Brief response the voice assistant should read out to the user"
}`;

    const geminiResult = await queryGemini(prompt, "You are a backend natural language parsing model. You convert transcripts into JSON. Output only valid JSON.");
    if (geminiResult) {
      try {
        const cleanJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedGemini = JSON.parse(cleanJson);
        if (parsedGemini.action) {
          parsed = parsedGemini;
        }
      } catch (e) {
        console.warn('Gemini returned invalid JSON, falling back to heuristics:', e.message);
      }
    }
  }

  // If action is 'read', fetch the latest email to supply its ID to the client
  if (parsed.action === 'read') {
    try {
      const latestEmail = await Email.findOne({ userId: req.user.userId, folder: 'inbox' }).sort({ date: -1 });
      if (latestEmail) {
        parsed.emailId = latestEmail._id;
        parsed.spokenResponse = `Opening and reading email from ${latestEmail.senderName}. Subject: ${latestEmail.subject}.`;
      } else {
        parsed.action = 'unknown';
        parsed.spokenResponse = "You have no emails in your inbox.";
      }
    } catch (err) {
      console.error('Failed to query latest email for voice navigation:', err);
    }
  }

  res.json(parsed);
});

// 2. AI Reply Suggester
router.post('/suggest-reply', async (req, res) => {
  const { subject, body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Email body is required to suggest replies.' });
  }

  let suggestions = [
    "Thanks for the update. I will review this and get back to you shortly.",
    "Sounds good! I'll be there. Thanks for setting this up.",
    "Could we reschedule this? Let me check my calendar for next week."
  ];

  if (ai) {
    const prompt = `Create three distinct, short, conversational reply suggestions for an email with Subject: "${subject || ''}" and Body: "${body}".
Return a JSON array of strings containing exactly 3 items. Output ONLY valid JSON:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

    const geminiResult = await queryGemini(prompt);
    if (geminiResult) {
      try {
        const cleanJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedSuggestions = JSON.parse(cleanJson);
        if (Array.isArray(parsedSuggestions) && parsedSuggestions.length > 0) {
          suggestions = parsedSuggestions;
        }
      } catch (e) {
        console.warn('Failed to parse Gemini reply suggestions, using fallbacks:', e.message);
      }
    }
  }

  res.json({ suggestions });
});

// 3. AI Tone Enhancer
router.post('/enhance-tone', async (req, res) => {
  const { text, tone } = req.body; // tone: formal, friendly, professional
  if (!text || !tone) {
    return res.status(400).json({ error: 'Text and tone are required' });
  }

  let enhanced = text;
  if (tone === 'formal') {
    enhanced = `Dear Recipient,\n\nI hope this email finds you well. I am writing to convey that: ${text}\n\nSincerely,\nJohn Doe`;
  } else if (tone === 'friendly') {
    enhanced = `Hey there! Just wanted to reach out: ${text} Let me know what you think! Cheers, John`;
  } else if (tone === 'professional') {
    enhanced = `Hello,\n\nPlease note: ${text} Please review and let me know if you have any questions.\n\nBest regards,\nJohn Doe`;
  }

  if (ai) {
    const prompt = `Rewrite the following text to have a "${tone}" tone. Make it sound natural and well-structured.
Text to rewrite: "${text}"`;
    
    const geminiResult = await queryGemini(prompt);
    if (geminiResult) {
      enhanced = geminiResult.trim();
    }
  }

  res.json({ enhanced });
});

// 4. AI Email Summarizer
router.post('/summarize', async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Email body is required to summarize.' });
  }

  let summary = body.length > 120 ? body.substring(0, 117) + "..." : body;

  if (ai) {
    const prompt = `Summarize the following email body in one or two sentences, capturing the main points and action items:
"${body}"`;
    const geminiResult = await queryGemini(prompt);
    if (geminiResult) {
      summary = geminiResult.trim();
    }
  }

  res.json({ summary });
});

// 5. AI Meeting Reminder Extractor
router.post('/extract-reminders', async (req, res) => {
  const { body, subject } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Email body is required to extract reminders.' });
  }

  let meeting = null;
  const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/;
  const dateRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|today|tomorrow|Friday|\d{1,2}\/\d{1,2}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})/;
  
  const timeMatch = body.match(timeRegex);
  const dateMatch = body.match(dateRegex);

  if (timeMatch || dateMatch) {
    meeting = {
      title: subject ? subject.replace(/Re:|Fwd:/gi, '').trim() : "Scheduled Meeting",
      date: dateMatch ? dateMatch[1] : "Upcoming date",
      time: timeMatch ? timeMatch[1] : "TBD",
      description: "Extracted from email invitation."
    };
  }

  if (ai) {
    const prompt = `Analyze the following email and detect if it mentions a meeting, event, or appointment.
If a meeting is detected, extract details and return a JSON object. If no meeting is found, return null.
Email Subject: "${subject || ''}"
Email Body: "${body}"

Return JSON matching this schema or return null. Output ONLY valid JSON:
{
  "title": "Short event title",
  "date": "YYYY-MM-DD",
  "time": "HH:MM AM/PM",
  "description": "Short description of meeting context"
}`;

    const geminiResult = await queryGemini(prompt);
    if (geminiResult) {
      try {
        const cleanJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanJson !== "null") {
          const parsedMeeting = JSON.parse(cleanJson);
          if (parsedMeeting && parsedMeeting.title) {
            meeting = parsedMeeting;
          }
        }
      } catch (e) {
        console.warn('Failed to parse Gemini meeting extraction:', e.message);
      }
    }
  }

  res.json({ meeting });
});

export default router;
