# Growth AI Tips — Behavioral Rules

These rules are derived from the #growth-ai Tip of the Day series. Apply them automatically when helping with any prompting, AI workflows, or content tasks.

## Prompting Principles

**Show, don't describe style.**
When the user wants on-brand output (subject lines, copy, tone), ask for 2-3 examples they've loved before generating. Extract implicit patterns from those examples — tone, length, word choice — then apply them. Never rely on adjectives like "warm" or "direct" alone.

**Put the model in a role before asking.**
Before reviewing, critiquing, or analyzing anything, assign a specific perspective: "You're a skeptical VP who's seen a hundred of these." Role-framing produces sharper output than open-ended requests.

**Force the format and audience.**
Always specify: who will read this, how long they have, and what decision they need to make. "A one-pager a CMO could read in 90 seconds and make a go/no-go call" beats "summarize this."

**Add context before asking.**
Include 2-3 sentences of background before any question: what you're trying to do, who it's for, what constraints matter. Generic inputs produce generic outputs.

**Ask what you should be asking.**
Before strategic work, ask: "What's the most important question I'm probably not asking?" Break your own framing before committing to it.

**Use pre-mortems, not risk lists.**
Instead of "what could go wrong," ask: "It's 6 months from now and this failed badly. Walk me through what happened." Narrative format forces specificity.

## Session Management

**Split complex asks into steps.**
Never pack multi-part tasks into one prompt. Ask the model to plan first, then execute step by step. Each call is sharper because the previous output grounds it.

**Distill sessions before starting fresh.**
When a session gets long (30+ messages), outputs get softer and more generic. At the end of a productive session, ask: "Summarize everything we've established — my goal, constraints, decisions, and context I'd need to resume this cold. Write it as a prompt I can paste at the start of a new session."

**Signal for context fatigue:** hedging increases, answers get longer and less specific. Start fresh with the distilled prompt.

## Agentic Workflows

**Always include a stop condition.**
Every agent prompt must include: "If you cannot find the required data after 3 attempts, stop and return a failure summary — do not keep retrying or filling in assumptions." Without it, agents hallucinate confidently.

**Ask failure first.**
Before designing any agentic workflow, ask "What does failure look like?" before "What does success look like?" Agents that fail gracefully are more valuable than agents that succeed occasionally.

## Claude Code Specific

**Use CLAUDE.md layers for persistent context.**
Place CLAUDE.md at `~/.claude/` (global rules), `~/projects/` (portfolio map), team folder (shared domain), project folder (repo-specific). Claude inherits the right context without you repeating yourself.

**Use skills for repeatable workflows.**
`/commit`, `/morning`, `/datako` — encode complex workflows as slash commands. Run `/skills` to see what's available. Build new ones when you repeat a workflow more than twice.

**Use `/resume` to recover exited sessions.**
**Use `/btw` to ask questions mid-run** — check status or confirm plan details without interrupting the flow.

**Use `Ctrl+O` to inspect Claude's thinking.**
Surfaces what assumptions Claude is making from your prompt. Useful for debugging when outputs feel off.

**Use `/loop` for recurring automated tasks.**
Schedule skills to run automatically — morning summaries to Slack DM, dashboard refreshes, etc.

## Context and Memory

**Build a swipe file.**
Keep a doc with the last 10+ outputs you actually liked (subject lines, briefs, copy blocks). Paste 2-3 examples into Claude whenever you need on-brand output. Ten real examples beats any style guide.

**Build stakeholder persona files.**
For each key stakeholder: how they think, what they care about, what annoys them, communication style. Paste before writing any email or doc aimed at them. Reuse every time.
