const fs = require('fs');
const path = require('path');

const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });

// Copy tips-data.json to deploy so client can fetch it
fs.copyFileSync(
  path.join(__dirname, 'tips-data.json'),
  path.join(deployDir, 'tips-data.json')
);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Growth AI Prompt Library</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7f7f5; color: #1a1a1a; min-height: 100vh; }

  header { background: #fff; border-bottom: 1px solid #e8e8e4; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 32px; height: 32px; background: #FF5A5F; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; }
  .logo-text { font-size: 16px; font-weight: 600; }
  .logo-sub { font-size: 12px; color: #717171; }
  .install-btn { background: #1a1a1a; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; }
  .install-btn:hover { background: #2d2d2d; }

  .main { max-width: 1100px; margin: 0 auto; padding: 40px 32px; }
  .hero { margin-bottom: 40px; }
  .hero h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .hero p { font-size: 15px; color: #717171; max-width: 520px; }

  .controls { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; align-items: center; }
  .search-wrap { position: relative; flex: 1; min-width: 240px; max-width: 380px; }
  #search { width: 100%; border: 1px solid #e8e8e4; border-radius: 10px; padding: 10px 14px 10px 38px; font-size: 14px; background: #fff; outline: none; }
  #search:focus { border-color: #1a1a1a; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #b0b0b0; pointer-events: none; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-btn { border: 1px solid #e8e8e4; background: #fff; border-radius: 20px; padding: 7px 14px; font-size: 13px; cursor: pointer; color: #484848; }
  .filter-btn.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
  .count { font-size: 13px; color: #717171; margin-left: auto; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

  .card { background: #fff; border: 1px solid #e8e8e4; border-radius: 14px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column; }
  .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .card-header { padding: 20px 20px 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .category-badge { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 20px; }
  .badge-Prompting { background: #FFF3E0; color: #E65100; }
  .badge-Claude-Code { background: #E8F5E9; color: #2E7D32; }
  .badge-Agentic { background: #EDE7F6; color: #4527A0; }
  .card-date { font-size: 11px; color: #b0b0b0; margin-top: 3px; }
  .card-body { padding: 16px 20px; flex: 1; }
  .card-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; line-height: 1.4; }
  .card-concept { font-size: 13px; color: #484848; line-height: 1.6; margin-bottom: 16px; }
  .prompt-preview { background: #f7f7f5; border-radius: 8px; padding: 12px; font-size: 12px; color: #484848; font-family: 'SF Mono','Fira Code',monospace; line-height: 1.5; white-space: pre-wrap; word-break: break-word; max-height: 80px; overflow: hidden; position: relative; margin-bottom: 12px; }
  .prompt-preview::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 30px; background: linear-gradient(transparent, #f7f7f5); }
  .tags { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 20px 12px; }
  .tag { font-size: 11px; color: #b0b0b0; background: #f7f7f5; border-radius: 4px; padding: 2px 7px; }
  .card-actions { display: flex; gap: 8px; padding: 0 20px 20px; }
  .btn-expand { flex: 1; border: 1px solid #e8e8e4; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; color: #484848; }
  .btn-expand:hover { background: #f7f7f5; }
  .btn-copy { border: none; background: #FF5A5F; color: white; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; }
  .btn-copy:hover { background: #e04e53; }
  .btn-copy.copied { background: #2E7D32; }

  /* Modal */
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; align-items: center; justify-content: center; padding: 24px; }
  .modal-overlay.open { display: flex; }
  .modal { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; }
  .modal-header { padding: 24px 24px 16px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e8e8e4; position: sticky; top: 0; background: #fff; }
  .modal-title { font-size: 18px; font-weight: 700; line-height: 1.3; max-width: 500px; }
  .modal-close { background: #f7f7f5; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; color: #484848; flex-shrink: 0; }
  .modal-close:hover { background: #ededeb; }
  .modal-body { padding: 24px; }
  .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #b0b0b0; margin-bottom: 8px; margin-top: 20px; }
  .section-label:first-child { margin-top: 0; }
  .concept-text { font-size: 14px; color: #484848; line-height: 1.7; }
  .prompt-block { background: #f7f7f5; border-radius: 10px; padding: 16px; font-size: 13px; font-family: 'SF Mono','Fira Code',monospace; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .what-to-change-list { list-style: none; }
  .what-to-change-item { font-size: 13px; color: #484848; padding: 7px 0; border-bottom: 1px solid #f0f0ee; display: flex; gap: 8px; line-height: 1.5; }
  .what-to-change-item:last-child { border-bottom: none; }
  .what-to-change-arrow { color: #FF5A5F; flex-shrink: 0; font-size: 12px; }
  .example-output { background: #f0f7f0; border-left: 3px solid #4CAF50; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 13px; color: #2d4a2d; line-height: 1.7; font-style: italic; }
  .modal-footer { padding: 0 24px 24px; }
  .btn-copy-full { width: 100%; background: #FF5A5F; color: white; border: none; border-radius: 10px; padding: 13px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-copy-full:hover { background: #e04e53; }
  .btn-copy-full.copied { background: #2E7D32; }

  /* Install modal */
  .install-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; align-items: center; justify-content: center; padding: 24px; }
  .install-overlay.open { display: flex; }
  .install-modal { background: #1a1a1a; border-radius: 16px; padding: 28px; max-width: 520px; width: 100%; color: #f7f7f5; }
  .install-modal h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .install-modal p { font-size: 13px; color: #b0b0b0; margin-bottom: 16px; line-height: 1.6; }
  .install-cmd { background: #2d2d2d; border-radius: 8px; padding: 14px 16px; font-family: 'SF Mono','Fira Code',monospace; font-size: 12px; color: #f7f7f5; word-break: break-all; margin-bottom: 16px; }
  .install-copy-btn { background: #FF5A5F; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; margin-bottom: 10px; }
  .install-close-btn { background: transparent; color: #b0b0b0; border: 1px solid #444; border-radius: 8px; padding: 10px 20px; font-size: 13px; cursor: pointer; width: 100%; }

  .empty { text-align: center; padding: 60px 20px; color: #b0b0b0; font-size: 15px; }
  @media (max-width: 600px) { .main { padding: 24px 16px; } header { padding: 16px; } .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-icon">🎩</div>
    <div>
      <div class="logo-text">Growth AI Prompt Library</div>
      <div class="logo-sub">#growth-ai · Tip of the Day archive</div>
    </div>
  </div>
  <button class="install-btn" id="open-install">⬇ Install Skill</button>
</header>

<div class="main">
  <div class="hero">
    <h1>Every tip. Every prompt. Ready to copy.</h1>
    <p>The full archive of #growth-ai tips — with the actual prompts, what to customize, and what good output looks like.</p>
  </div>

  <div class="controls">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input id="search" type="text" placeholder="Search tips…">
    </div>
    <div class="filters" id="filters">
      <button class="filter-btn active" data-cat="all">All</button>
      <button class="filter-btn" data-cat="Prompting">Prompting</button>
      <button class="filter-btn" data-cat="Claude Code">Claude Code</button>
      <button class="filter-btn" data-cat="Agentic">Agentic</button>
    </div>
    <div class="count" id="count"></div>
  </div>

  <div class="grid" id="grid"></div>
</div>

<!-- Tip Modal -->
<div class="modal-overlay" id="modal">
  <div class="modal" id="modal-inner"></div>
</div>

<!-- Install Modal -->
<div class="install-overlay" id="install-overlay">
  <div class="install-modal">
    <h3>Install the Growth AI Skill</h3>
    <p>This skill encodes all tips as behavioral rules Claude applies automatically — no need to remember them while prompting.</p>
    <div class="install-cmd" id="install-cmd-text">curl -s https://raw.githubusercontent.com/jsavage-twin/growth-ai-tips/main/growth-ai-tips.md &gt; ~/.claude/skills/growth-ai-tips.md</div>
    <button class="install-copy-btn" id="install-copy">Copy install command</button>
    <button class="install-close-btn" id="install-close">Close</button>
  </div>
</div>

<script>
let TIPS = [];
let activeFilter = 'all';
let activeModal = null;

async function init() {
  const res = await fetch('/tips-data.json');
  TIPS = await res.json();
  render();
  bindEvents();
}

function bindEvents() {
  document.getElementById('search').addEventListener('input', render);

  document.getElementById('filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    activeFilter = btn.dataset.cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });

  document.getElementById('open-install').addEventListener('click', () => {
    document.getElementById('install-overlay').classList.add('open');
  });
  document.getElementById('install-close').addEventListener('click', () => {
    document.getElementById('install-overlay').classList.remove('open');
  });
  document.getElementById('install-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
  document.getElementById('install-copy').addEventListener('click', () => {
    const rawCmd = 'curl -s https://raw.githubusercontent.com/jsavage-twin/growth-ai-tips/main/growth-ai-tips.md > ~/.claude/skills/growth-ai-tips.md';
    navigator.clipboard.writeText(rawCmd).then(() => {
      const btn = document.getElementById('install-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy install command'; }, 2000);
    });
  });

  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); document.getElementById('install-overlay').classList.remove('open'); }
  });
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const grid = document.getElementById('grid');

  const filtered = TIPS.filter(t => {
    if (activeFilter !== 'all' && t.category !== activeFilter) return false;
    if (!q) return true;
    return t.title.toLowerCase().includes(q) ||
      t.concept.toLowerCase().includes(q) ||
      t.prompt.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q));
  });

  document.getElementById('count').textContent = filtered.length + ' tip' + (filtered.length !== 1 ? 's' : '');
  grid.textContent = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No tips match your search.';
    grid.appendChild(empty);
    return;
  }

  filtered.forEach(t => grid.appendChild(buildCard(t)));
}

function buildCard(t) {
  const card = document.createElement('div');
  card.className = 'card';
  card.addEventListener('click', () => openModal(t.id));

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'card-header';
  const badge = document.createElement('span');
  badge.className = 'category-badge badge-' + t.category.replace(/\s+/g, '-');
  badge.textContent = t.category;
  const dateEl = document.createElement('span');
  dateEl.className = 'card-date';
  dateEl.textContent = formatDate(t.date);
  hdr.appendChild(badge);
  hdr.appendChild(dateEl);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = t.title;
  const concept = document.createElement('div');
  concept.className = 'card-concept';
  concept.textContent = t.concept;
  const preview = document.createElement('div');
  preview.className = 'prompt-preview';
  preview.textContent = t.prompt;
  body.appendChild(title);
  body.appendChild(concept);
  body.appendChild(preview);

  // Tags
  const tags = document.createElement('div');
  tags.className = 'tags';
  t.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = '#' + tag;
    tags.appendChild(span);
  });

  // Actions
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const expandBtn = document.createElement('button');
  expandBtn.className = 'btn-expand';
  expandBtn.textContent = 'View full tip';
  expandBtn.addEventListener('click', e => { e.stopPropagation(); openModal(t.id); });
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-copy';
  copyBtn.id = 'copy-' + t.id;
  copyBtn.textContent = 'Copy prompt';
  copyBtn.addEventListener('click', e => { e.stopPropagation(); copyPrompt(t, copyBtn); });
  actions.appendChild(expandBtn);
  actions.appendChild(copyBtn);

  card.appendChild(hdr);
  card.appendChild(body);
  card.appendChild(tags);
  card.appendChild(actions);
  return card;
}

function openModal(id) {
  const t = TIPS.find(x => x.id === id);
  if (!t) return;
  activeModal = t;

  const inner = document.getElementById('modal-inner');
  inner.textContent = '';

  // Header
  const mhdr = document.createElement('div');
  mhdr.className = 'modal-header';
  const mtitle = document.createElement('div');
  mtitle.className = 'modal-title';
  mtitle.textContent = t.title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeModal);
  mhdr.appendChild(mtitle);
  mhdr.appendChild(closeBtn);

  // Body
  const mbody = document.createElement('div');
  mbody.className = 'modal-body';

  mbody.appendChild(label('The concept'));
  const conceptEl = document.createElement('div');
  conceptEl.className = 'concept-text';
  conceptEl.textContent = t.concept;
  mbody.appendChild(conceptEl);

  mbody.appendChild(label('The prompt'));
  const promptEl = document.createElement('div');
  promptEl.className = 'prompt-block';
  promptEl.textContent = t.prompt;
  mbody.appendChild(promptEl);

  mbody.appendChild(label('What to customize'));
  const list = document.createElement('ul');
  list.className = 'what-to-change-list';
  t.what_to_change.forEach(w => {
    const li = document.createElement('li');
    li.className = 'what-to-change-item';
    const arrow = document.createElement('span');
    arrow.className = 'what-to-change-arrow';
    arrow.textContent = '→';
    const text = document.createElement('span');
    text.textContent = w;
    li.appendChild(arrow);
    li.appendChild(text);
    list.appendChild(li);
  });
  mbody.appendChild(list);

  mbody.appendChild(label('What good output looks like'));
  const exampleEl = document.createElement('div');
  exampleEl.className = 'example-output';
  exampleEl.textContent = t.example_output;
  mbody.appendChild(exampleEl);

  // Footer
  const mfooter = document.createElement('div');
  mfooter.className = 'modal-footer';
  const copyFullBtn = document.createElement('button');
  copyFullBtn.className = 'btn-copy-full';
  copyFullBtn.id = 'modal-full-copy-' + t.id;
  copyFullBtn.textContent = 'Copy prompt to clipboard';
  copyFullBtn.addEventListener('click', () => copyPrompt(t, copyFullBtn));
  mfooter.appendChild(copyFullBtn);

  inner.appendChild(mhdr);
  inner.appendChild(mbody);
  inner.appendChild(mfooter);

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function label(text) {
  const el = document.createElement('div');
  el.className = 'section-label';
  el.textContent = text;
  return el;
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
  activeModal = null;
}

function copyPrompt(t, btn) {
  navigator.clipboard.writeText(t.prompt).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
  });
}

function formatDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

init();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(deployDir, 'index.html'), html);
console.log('Build complete → deploy/index.html');
