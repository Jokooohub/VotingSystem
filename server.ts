import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface VoteRecord {
  id: string;
  officeId: string;
  candidateId: number;
  candidateName: string;
  candidateDesignation: string;
  voterId?: number;
  voterName: string;
  reason?: string;
  timestamp: string;
  verificationCode: string;
}

interface ElectionSettings {
  isResultsPublic: boolean;
  adminName: string;
}

const app = express();
const PORT = 3000;

// Persistent database file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data dir', err);
  }
}

// Load persistent data from disk on server start
function loadVotesFromDisk(): VoteRecord[] {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      const raw = fs.readFileSync(VOTES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading votes.json:', err);
  }
  return [];
}

function saveVotesToDisk(votes: VoteRecord[]): void {
  try {
    fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing votes.json:', err);
  }
}

function loadSettingsFromDisk(): ElectionSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading settings.json:', err);
  }
  return {
    isResultsPublic: false,
    adminName: 'Joko J. Saco',
  };
}

function saveSettingsToDisk(settings: ElectionSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing settings.json:', err);
  }
}

let votesStore: VoteRecord[] = loadVotesFromDisk();
let settingsStore: ElectionSettings = loadSettingsFromDisk();

// Middleware: Enable CORS for cross-device support (mobile to laptop)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// SSE connected clients
const sseClients = new Set<express.Response>();

function broadcast(type: string, data: unknown) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
}

// 1. Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: sseClients.size,
    totalVotes: votesStore.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Get all votes and settings
app.get('/api/votes', (req, res) => {
  res.json({
    votes: votesStore,
    settings: settingsStore,
    total: votesStore.length,
    timestamp: Date.now(),
  });
});

// 3. Submit a vote (Persist to disk & live broadcast to all connected devices)
app.post('/api/vote', (req, res) => {
  const { vote } = req.body;
  if (!vote || !vote.candidateId || !vote.voterName) {
    return res.status(400).json({ error: 'Invalid vote payload' });
  }

  // Refresh from disk to prevent race conditions
  votesStore = loadVotesFromDisk();

  // Check duplicate
  const alreadyVoted = votesStore.some((v) => {
    if (vote.voterId && v.voterId === vote.voterId) return true;
    if (v.voterName && v.voterName.trim().toLowerCase() === vote.voterName.trim().toLowerCase()) return true;
    return false;
  });

  if (alreadyVoted) {
    return res.status(409).json({ error: 'Ballot already cast by this voter', allVotes: votesStore });
  }

  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const hexPart = Math.random().toString(36).substring(2, 4).toUpperCase();
  const verificationCode = `DCFSSS-${vote.officeId}-${randomSuffix}-${hexPart}`;

  const record: VoteRecord = {
    ...vote,
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    verificationCode,
  };

  votesStore.unshift(record);
  saveVotesToDisk(votesStore);

  // Broadcast live update to all voters
  broadcast('VOTE_ADDED', { newVote: record, totalVotes: votesStore.length, allVotes: votesStore });

  res.status(201).json({ success: true, record, allVotes: votesStore });
});

// 4. Two-way sync endpoint for merge reconciliation
app.post('/api/sync', (req, res) => {
  const { localVotes } = req.body;
  votesStore = loadVotesFromDisk();

  if (Array.isArray(localVotes) && localVotes.length > 0) {
    let hasNew = false;
    localVotes.forEach((lv: VoteRecord) => {
      if (lv && lv.voterName && !votesStore.some((sv) => sv.verificationCode === lv.verificationCode || sv.voterName.trim().toLowerCase() === lv.voterName.trim().toLowerCase())) {
        votesStore.unshift(lv);
        hasNew = true;
      }
    });

    if (hasNew) {
      saveVotesToDisk(votesStore);
      broadcast('VOTE_ADDED', { allVotes: votesStore, totalVotes: votesStore.length });
    }
  }

  res.json({ success: true, allVotes: votesStore, settings: settingsStore });
});

// 5. Update election settings (Anonymous vs Public toggle)
app.post('/api/settings', (req, res) => {
  const { isResultsPublic } = req.body;
  if (typeof isResultsPublic === 'boolean') {
    settingsStore.isResultsPublic = isResultsPublic;
    saveSettingsToDisk(settingsStore);
    broadcast('SETTINGS_UPDATED', settingsStore);
    return res.json({ success: true, settings: settingsStore });
  }
  res.status(400).json({ error: 'Invalid settings' });
});

// 6. Reset single employee vote (Admin power)
app.post('/api/reset-vote', (req, res) => {
  const { voterIdOrName } = req.body;
  if (!voterIdOrName) return res.status(400).json({ error: 'Missing voter identifier' });

  votesStore = loadVotesFromDisk();

  if (typeof voterIdOrName === 'number') {
    votesStore = votesStore.filter((v) => v.voterId !== voterIdOrName);
  } else {
    const clean = String(voterIdOrName).trim().toLowerCase();
    votesStore = votesStore.filter((v) => {
      if (v.voterId && String(v.voterId) === clean) return false;
      if (v.voterName && v.voterName.trim().toLowerCase() === clean) return false;
      return true;
    });
  }

  saveVotesToDisk(votesStore);
  broadcast('VOTES_RESET_SINGLE', { allVotes: votesStore, totalVotes: votesStore.length });
  res.json({ success: true, allVotes: votesStore });
});

// 7. Reset all election votes (Admin power)
app.post('/api/reset-all', (req, res) => {
  votesStore = [];
  saveVotesToDisk(votesStore);
  broadcast('VOTES_CLEARED', { allVotes: [], totalVotes: 0 });
  res.json({ success: true, message: 'All votes reset to 0' });
});

// 8. Live Server-Sent Events (SSE) stream
app.get('/api/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial current data
  res.write(`data: ${JSON.stringify({ type: 'INIT', data: { votes: votesStore, settings: settingsStore } })}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DCFSSS Live Election Server running on http://localhost:${PORT}`);
  });
}

startServer();
