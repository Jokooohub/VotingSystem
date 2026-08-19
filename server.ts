import express from 'express';
import path from 'path';
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

app.use(express.json());

// In-memory shared store for live synchronization across all devices
let votesStore: VoteRecord[] = [];
let settingsStore: ElectionSettings = {
  isResultsPublic: false,
  adminName: 'Joko J. Saco',
};

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

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', connectedClients: sseClients.size, totalVotes: votesStore.length });
});

// 2. Get all votes and settings
app.get('/api/votes', (req, res) => {
  res.json({
    votes: votesStore,
    settings: settingsStore,
    total: votesStore.length,
  });
});

// 3. Submit a vote (Live broadcast to all connected devices)
app.post('/api/vote', (req, res) => {
  const { vote } = req.body;
  if (!vote || !vote.candidateId || !vote.voterName) {
    return res.status(400).json({ error: 'Invalid vote payload' });
  }

  // Check duplicate
  const alreadyVoted = votesStore.some((v) => {
    if (vote.voterId && v.voterId === vote.voterId) return true;
    if (v.voterName && v.voterName.trim().toLowerCase() === vote.voterName.trim().toLowerCase()) return true;
    return false;
  });

  if (alreadyVoted) {
    return res.status(409).json({ error: 'Ballot already cast by this voter' });
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

  // Broadcast live update to all voters
  broadcast('VOTE_ADDED', { newVote: record, totalVotes: votesStore.length, allVotes: votesStore });

  res.status(201).json({ success: true, record, allVotes: votesStore });
});

// 4. Update election settings (Anonymous vs Public toggle)
app.post('/api/settings', (req, res) => {
  const { isResultsPublic } = req.body;
  if (typeof isResultsPublic === 'boolean') {
    settingsStore.isResultsPublic = isResultsPublic;
    broadcast('SETTINGS_UPDATED', settingsStore);
    return res.json({ success: true, settings: settingsStore });
  }
  res.status(400).json({ error: 'Invalid settings' });
});

// 5. Reset single employee vote (Admin power)
app.post('/api/reset-vote', (req, res) => {
  const { voterIdOrName } = req.body;
  if (!voterIdOrName) return res.status(400).json({ error: 'Missing voter identifier' });

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

  broadcast('VOTES_RESET_SINGLE', { allVotes: votesStore, totalVotes: votesStore.length });
  res.json({ success: true, allVotes: votesStore });
});

// 6. Reset all election votes (Admin power)
app.post('/api/reset-all', (req, res) => {
  votesStore = [];
  broadcast('VOTES_CLEARED', { allVotes: [], totalVotes: 0 });
  res.json({ success: true, message: 'All votes reset to 0' });
});

// 7. Live Server-Sent Events (SSE) stream
app.get('/api/live-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial data
  res.write(`data: ${JSON.stringify({ type: 'INIT', data: { votes: votesStore, settings: settingsStore } })}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

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
