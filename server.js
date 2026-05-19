const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PORT = process.env.PORT || 8001;
const DEPLOY_DIR = path.join(__dirname, 'deploy');
const TIPS_FILE = path.join(__dirname, 'tips-data.json');

// Josh's Slack user ID — only process tips from Josh
const JOSH_USER_ID = 'UTEM8EPT3';
const GROWTH_AI_CHANNEL = 'C0APQHS7MFS';
const TIP_TRIGGER = ':tipping-hat:';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

// ── Secrets ───────────────────────────────────────────────────────────────────

function secret(envKey, filename) {
  if (process.env[envKey]) return process.env[envKey].trim();
  if (!filename) return null;
  const candidates = [
    path.join('/secrets', filename),
    path.join(process.env.HOME || '', '.secrets', filename),
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, 'utf8').trim(); } catch (_) {}
  }
  return null;
}

const SLACK_SIGNING_SECRET = secret('SLACK_SIGNING_SECRET', 'slack-signing-secret.txt');
const ANTHROPIC_API_KEY = secret('ANTHROPIC_API_KEY', 'anthropic-api-key.txt');
const BEDROCK_BASE_URL = process.env.ANTHROPIC_BEDROCK_BASE_URL;

// ── Slack signature verification ──────────────────────────────────────────────

function verifySlackSignature(rawBody, headers) {
  if (!SLACK_SIGNING_SECRET) {
    console.warn('No SLACK_SIGNING_SECRET — skipping signature check (dev mode)');
    return true;
  }
  const timestamp = headers['x-slack-request-timestamp'];
  const slackSig = headers['x-slack-signature'];
  if (!timestamp || !slackSig) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;
  const base = `v0:${timestamp}:${rawBody}`;
  const computed = 'v0=' + crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(base).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(slackSig));
}

// ── Claude API ────────────────────────────────────────────────────────────────

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let options, mod;

    if (BEDROCK_BASE_URL) {
      const url = new URL(BEDROCK_BASE_URL + '/v1/messages');
      const isHttps = url.protocol === 'https:';
      mod = isHttps ? https : http;
      options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };
    } else {
      mod = https;
      options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      };
    }

    const req = mod.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Tip extraction ────────────────────────────────────────────────────────────

async function extractTip(messageText, existingTips) {
  const nextId = Math.max(...existingTips.map(t => t.id)) + 1;
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `Extract a structured tip from this Slack message. Respond with only a valid JSON object, no markdown fences.

Schema:
{
  "id": ${nextId},
  "date": "${today}",
  "title": "<concise title, max 8 words>",
  "category": "<Prompting | Claude Code | Agentic>",
  "concept": "<1-2 sentence core insight>",
  "prompt": "<copy-paste prompt template with [placeholders]>",
  "what_to_change": ["<item 1>", "<item 2>", "<item 3>"],
  "example_output": "<1-2 sentences describing concrete good output>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}

Category rules:
- "Claude Code" → Claude Code CLI, Airchat, skills, CLAUDE.md, slash commands
- "Agentic" → agents, automation, scheduled workflows
- "Prompting" → everything else

Tip message:
${messageText}`;

  const raw = await callClaude(prompt);
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

// ── Append tip + rebuild ──────────────────────────────────────────────────────

function appendAndRebuild(tip) {
  const tips = JSON.parse(fs.readFileSync(TIPS_FILE, 'utf8'));

  if (tips.some(t => t.date === tip.date)) {
    console.log(`Tip for ${tip.date} already exists — skipping`);
    return false;
  }

  tips.push(tip);
  fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2));
  console.log(`Appended tip #${tip.id}: ${tip.title}`);

  // Rebuild deploy/ — fixed args, no user input
  execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
  console.log('Rebuilt deploy/');
  return true;
}

// ── Webhook handler ───────────────────────────────────────────────────────────

async function handleWebhook(rawBody) {
  const payload = JSON.parse(rawBody);

  // Slack URL verification handshake (one-time setup)
  if (payload.type === 'url_verification') {
    return { status: 200, body: JSON.stringify({ challenge: payload.challenge }) };
  }

  const event = payload.event;
  if (!event) return { status: 200, body: 'ok' };

  // Only process tip messages from Josh in #growth-ai
  if (
    event.type !== 'message' ||
    event.subtype ||
    event.user !== JOSH_USER_ID ||
    event.channel !== GROWTH_AI_CHANNEL ||
    !event.text?.includes(TIP_TRIGGER)
  ) {
    return { status: 200, body: 'ignored' };
  }

  console.log(`Tip detected — extracting (ts=${event.ts})`);

  try {
    const tips = JSON.parse(fs.readFileSync(TIPS_FILE, 'utf8'));
    const tip = await extractTip(event.text, tips);
    appendAndRebuild(tip);
  } catch (err) {
    console.error('Tip extraction failed:', err.message);
    fs.appendFileSync(
      path.join(__dirname, 'failed-tips.log'),
      JSON.stringify({ ts: new Date().toISOString(), text: event.text, error: err.message }) + '\n'
    );
  }

  return { status: 200, body: 'ok' };
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {

    if (req.method === 'POST' && req.url === '/webhook/slack') {
      if (!verifySlackSignature(rawBody, req.headers)) {
        res.writeHead(401); res.end('Unauthorized');
        return;
      }
      try {
        const result = await handleWebhook(rawBody);
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(result.body);
      } catch (err) {
        console.error('Webhook error:', err.message);
        res.writeHead(500); res.end('error');
      }
      return;
    }

    if (req.url === '/healthz') {
      res.writeHead(200); res.end('ok');
      return;
    }

    // Static files
    const safePath = req.url === '/' ? 'index.html' : req.url.replace(/^\/+/, '');
    const filePath = path.join(DEPLOY_DIR, safePath);
    // Prevent path traversal outside deploy dir
    if (!filePath.startsWith(DEPLOY_DIR)) {
      res.writeHead(403); res.end('Forbidden');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(DEPLOY_DIR, 'index.html'), (err2, data2) => {
          if (err2) { res.writeHead(404); res.end('Not found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => console.log(`growth-ai-tips running on port ${PORT}`));
