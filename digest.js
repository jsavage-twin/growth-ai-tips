#!/usr/bin/env node
/**
 * Weekly Growth AI Digest
 *
 * Posts a weekly summary of new tips to #growth-ai.
 * Run manually or via cron: node digest.js
 *
 * Env vars required:
 *   SLACK_BOT_TOKEN  — xoxb- token with chat:write scope
 *
 * Optional:
 *   DIGEST_CHANNEL   — Slack channel ID (default: C0APQHS7MFS = #growth-ai)
 *   DIGEST_DAYS      — how many days back to look (default: 7)
 *   DRY_RUN          — if set, prints message instead of posting
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CHANNEL = process.env.DIGEST_CHANNEL || 'C0APQHS7MFS';
const DAYS_BACK = parseInt(process.env.DIGEST_DAYS || '7', 10);
const DRY_RUN = !!process.env.DRY_RUN;

// Token: env var first, then local secret file
function loadToken() {
  if (process.env.SLACK_BOT_TOKEN) return process.env.SLACK_BOT_TOKEN.trim();
  const candidates = [
    path.join(process.env.HOME || '', '.secrets', 'slack-growth-ai.txt'),
    '/secrets/slack-growth-ai.txt',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
  }
  return null;
}
const TOKEN = loadToken();

function getTipsThisWeek(tips) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_BACK);
  cutoff.setHours(0, 0, 0, 0);
  return tips.filter(t => new Date(t.date + 'T12:00:00') >= cutoff);
}

function pickHighlight(tips) {
  // Most recent tip as the featured one
  return tips[tips.length - 1];
}

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildMessage(weekTips, allTips) {
  if (!weekTips.length) {
    return null;
  }

  const highlight = pickHighlight(weekTips);
  const categoryEmoji = { Prompting: ':brain:', 'Claude Code': ':computer:', Agentic: ':robot_face:' };

  const tipLines = weekTips.map(t =>
    `• ${categoryEmoji[t.category] || ':tipping-hat:'} *${t.title}* (${formatDate(t.date)})`
  ).join('\n');

  const lines = [
    `:tipping-hat: *Weekly Growth AI Digest* — ${formatDate(weekTips[0].date)} to ${formatDate(weekTips[weekTips.length - 1].date)}`,
    '',
    `This week's tips (${weekTips.length} new):`,
    tipLines,
    '',
    `*Featured prompt this week:* _${highlight.title}_`,
    `> ${highlight.concept}`,
    '',
    `\`\`\`${highlight.prompt.split('\n').slice(0, 4).join('\n')}${highlight.prompt.split('\n').length > 4 ? '\n…' : ''}\`\`\``,
    '',
    `:card_index: *Full library (${allTips.length} tips, copy-paste prompts):*`,
    `https://growth-ai-tips.sandcastle.musta.ch`,
    '',
    `_Install the skill so Claude applies all tips automatically:_`,
    '```curl -s https://raw.githubusercontent.com/jsavage-twin/growth-ai-tips/main/growth-ai-tips.md > ~/.claude/skills/growth-ai-tips.md```',
  ];

  return lines.join('\n');
}

function postToSlack(message) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ channel: CHANNEL, text: message, unfurl_links: false });
    const options = {
      hostname: 'slack.com',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) resolve(parsed);
          else reject(new Error(`Slack API error: ${parsed.error}`));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const tips = JSON.parse(fs.readFileSync(path.join(__dirname, 'tips-data.json'), 'utf8'));
  const weekTips = getTipsThisWeek(tips);

  if (!weekTips.length) {
    console.log(`No new tips in the last ${DAYS_BACK} days. No digest sent.`);
    return;
  }

  const message = buildMessage(weekTips, tips);

  if (DRY_RUN) {
    console.log('=== DRY RUN — message that would be posted ===\n');
    console.log(message);
    console.log(`\n=== ${weekTips.length} tips this week, ${tips.length} total ===`);
    return;
  }

  if (!TOKEN) {
    console.error('ERROR: SLACK_BOT_TOKEN not set. Use DRY_RUN=1 to preview.');
    process.exit(1);
  }

  const result = await postToSlack(message);
  console.log(`Digest posted to #growth-ai. ts=${result.ts}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
