<div align="center">

# 🛡️ MergeGuard UI

### Agentic Frontend QA for Pull Requests

**A reusable GitHub Action that opens preview deployments, runs browser-based UI checks, and posts evidence-backed PR reviews before merge.**

<br />

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Native-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Browser%20QA-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Accessibility](https://img.shields.io/badge/A11y-Axe%20Checks-6A5ACD?style=for-the-badge)
![CI/CD](https://img.shields.io/badge/CI%2FCD-PR%20Review-111827?style=for-the-badge)

<br />

> **MergeGuard UI is an agentic frontend reviewer that uses real browser context to validate UI changes before merge.**

</div>

---

## 📌 Project Summary

**MergeGuard UI** is a developer tool that helps frontend teams catch UI regressions during pull request review.

Most CI checks are static. They lint code, run unit tests, or verify formatting, but they often miss what actually happens in the browser.

MergeGuard solves that gap by opening the PR preview deployment in Playwright, running targeted browser checks, collecting evidence, and posting a human-readable review comment directly on the pull request.

It is designed to behave like a focused frontend QA reviewer:

- Reads changed files in a pull request
- Identifies risky UI areas such as navigation, forms, modals, layout, themes, and accessibility
- Opens the preview app in a real browser
- Checks console errors, layout overflow, accessibility, network failures, and interaction behavior
- Captures screenshots, traces, logs, and JSON evidence
- Posts a severity-ranked PR comment with confidence scores and suggested causes

The core philosophy is simple:

> **No evidence, no finding.**

---

## 💼 Recruiter-Friendly Overview

This project demonstrates practical frontend engineering beyond building screens.

**MergeGuard UI combines:**

- Frontend engineering
- GitHub Actions automation
- Playwright browser testing
- Accessibility validation
- CI/CD workflow design
- PR review automation
- Agentic AI integration
- Evidence-backed QA reporting

The goal is to show how AI can be used responsibly in developer tooling: not as a vague chatbot, but as a bounded reviewer that works from browser evidence.

---

## 🧠 Why I Built This

Frontend regressions are hard to catch in code review because many issues only appear at runtime.

A pull request can look clean in the diff but still introduce problems like:

- A mobile layout that overflows at 390px
- A dark mode contrast regression
- A modal that traps focus incorrectly
- A form button that throws a runtime error
- A navigation menu that breaks keyboard behavior
- A component that renders correctly on desktop but fails on mobile

Traditional checks often miss these because they do not open the actual preview app.

MergeGuard adds a browser-aware review layer to the PR process.

It gives reviewers evidence they can act on instead of vague feedback.

---

## 🎯 What Problem It Solves

| Common PR Review Problem | How MergeGuard Helps |
|---|---|
| Reviewers cannot manually test every preview | Opens the preview automatically |
| Static checks miss runtime bugs | Runs real browser checks with Playwright |
| Accessibility issues slip through | Runs Axe accessibility scans |
| Mobile regressions are missed | Tests responsive viewports |
| Console errors are invisible in code review | Captures console and page errors |
| QA feedback can be vague | Posts evidence-backed findings |
| Screenshots and logs are hard to collect | Uploads organized artifacts |
| Full regression suites can be noisy | Focuses on changed UI surfaces |

---

## ✨ Key Features

### 🔍 Pull Request Awareness

MergeGuard reads the pull request context and changed files to decide what kind of UI checks are most useful.

| Changed File | Likely Risk | Checks |
|---|---|---|
| `Header.tsx` | Navigation regression | Mobile layout, interaction, accessibility |
| `Nav.tsx` | Menu behavior | Keyboard flow, focus behavior, console |
| `Modal.tsx` | Dialog behavior | Focus trap, escape key, accessibility |
| `CheckoutForm.tsx` | Form behavior | Labels, submit interaction, console |
| `dark-mode.css` | Theme regression | Contrast, layout, accessibility |
| `layout.css` | Responsive breakage | Mobile and desktop overflow |

---

### 🌐 Browser-Based Validation

MergeGuard opens the preview deployment in Playwright and checks the running app, not just the code.

It can detect:

- Browser console errors
- Runtime page exceptions
- Failed network requests
- 5xx responses
- Horizontal overflow
- Accessibility violations
- Basic interaction failures
- Responsive layout issues

---

### 📸 Evidence Artifacts

Every run produces evidence that can be downloaded from GitHub Actions.

```txt
artifacts/
├── run_summary.json
├── screenshots/
│   └── *.png
├── traces/
│   └── *.zip
├── logs/
│   └── *.json
└── a11y/
    └── *.json
```

This makes findings easier to verify and debug.

---

### 💬 Human-Readable PR Review

MergeGuard posts a structured review comment directly on the pull request.

Example:

```md
## MergeGuard UI Review

Preview tested: http://127.0.0.1:4173
Commit: `5cdf890568df`
Mode: `deterministic`
Model: `none`
Duration: 6.1s

### Summary

Found 2 evidence-backed issue(s): 0 high, 2 medium, 0 low.

| Severity | Category | Finding | Confidence |
|---|---|---|---:|
| 🟠 medium | layout | Possible horizontal overflow on mobile | 91% |
| 🟠 medium | accessibility | Accessibility issue on changed frontend surface | 92% |
```

---

## 🧪 Proven Working Demo

MergeGuard was tested against the included demo site and successfully posted a PR review comment.

The demo run found:

| Severity | Category | Finding | Confidence |
|---|---|---|---:|
| 🟠 Medium | Layout | Possible horizontal overflow on mobile | 91% |
| 🟠 Medium | Accessibility | Accessibility issue on changed frontend surface | 92% |

This confirms the full workflow works end to end:

```txt
Pull Request opened
     ↓
GitHub Action triggered
     ↓
Preview site started
     ↓
MergeGuard ran Playwright checks
     ↓
Evidence was captured
     ↓
PR comment was posted
     ↓
Artifacts were uploaded
```

---

## 🧱 Architecture

MergeGuard is built as a **composite GitHub Action**.

That means it runs inside GitHub Actions without needing a hosted backend, database, dashboard, or external service.

```txt
GitHub Pull Request
     ↓
GitHub Actions Workflow
     ↓
MergeGuard Composite Action
     ↓
Install dependencies
     ↓
Compile TypeScript
     ↓
Install Playwright browser
     ↓
Read PR metadata and changed files
     ↓
Build browser test plan
     ↓
Run Playwright checks
     ↓
Capture artifacts
     ↓
Post PR review comment
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Automation | GitHub Actions |
| Browser testing | Playwright |
| Accessibility | Axe via `@axe-core/playwright` |
| Validation | Zod schemas |
| PR integration | GitHub REST API |
| AI providers | OpenAI, RapidAPI, provider-adapter friendly |
| Runtime model | Composite GitHub Action |
| Evidence storage | GitHub Actions artifacts |

---

## ✅ What MergeGuard Checks

### Browser Runtime

- Console errors
- Page exceptions
- Failed network requests
- 5xx responses

### Responsive Layout

- Mobile viewport checks
- Desktop viewport checks
- Horizontal overflow detection
- Screenshot capture

### Accessibility

- Axe accessibility scan
- Missing labels
- Color contrast issues
- Landmark and role issues
- Dialog and form accessibility issues

### Interaction Behavior

- Navigation probes
- Modal and dialog behavior
- Keyboard escape handling
- Focus behavior
- Form button probes

---

## 🧩 Modes

MergeGuard supports two modes.

---

### 1. Deterministic Mode

```yaml
mode: deterministic
```

Deterministic mode does not require an AI key.

It uses local rules to map changed files to browser checks.

This is the best default for:

- Free usage
- Predictable CI behavior
- Fast testing
- Portfolio demos
- Private repositories
- Teams that do not want model calls in CI

Example:

```yaml
- name: Run MergeGuard UI
  uses: tabitha-dev/MergeGuard@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    preview-url: ${{ env.PREVIEW_URL }}
    mode: deterministic
    fail-on-severity: high
```

---

### 2. Agentic Mode

```yaml
mode: agentic
```

Agentic mode uses an LLM at bounded decision points.

The model can help with:

1. Planning which UI surfaces to check
2. Summarizing raw browser evidence into clearer findings

The browser execution remains deterministic and evidence-bound.

That means the model does **not** freely browse, invent bugs, or modify code.

It can only help plan and summarize based on the evidence MergeGuard collects.

---

## 🤖 Why RapidAPI Is Included

RapidAPI support is included because this project was designed to be easy to demo without requiring a paid model backend.

I included RapidAPI because it provides a simple **BYO-key, free-tier-friendly path** for testing agentic behavior.

RapidAPI is useful for this project because:

- Some model endpoints offer free or low-cost tiers
- It is easy to plug into a GitHub Action
- It avoids forcing every user to use OpenAI
- It keeps the project flexible for demos and experimentation
- It makes the AI provider replaceable instead of hardcoded

Important notes:

- RapidAPI is optional
- Deterministic mode works without RapidAPI
- RapidAPI pricing and limits depend on the specific endpoint
- API keys should always be stored as GitHub Actions secrets
- Any key accidentally pasted into code, chat, issues, or commits should be rotated

---

## 🔁 What Changes If You Use a Different AI API?

MergeGuard was designed so the AI provider can be swapped without changing the browser runner.

The browser runner should stay stable.

The provider layer is the part that changes.

If you want to use a different API, such as Anthropic, Gemini, Groq, OpenRouter, Together AI, Azure OpenAI, or a self-hosted model, you would update these areas:

---

### 1. Add Inputs to `action.yml`

Example:

```yaml
custom-api-key:
  description: 'Optional API key for custom provider'
  required: false

custom-api-url:
  description: 'Custom model API endpoint'
  required: false

llm-provider:
  description: 'LLM provider for agentic mode. Options: openai, rapidapi, custom'
  required: false
  default: openai
```

---

### 2. Pass Inputs as Environment Variables

In the composite action runtime:

```yaml
env:
  INPUT_LLM_PROVIDER: ${{ inputs.llm-provider }}
  INPUT_CUSTOM_API_KEY: ${{ inputs.custom-api-key }}
  INPUT_CUSTOM_API_URL: ${{ inputs.custom-api-url }}
```

---

### 3. Add a Provider Adapter

Create a provider file:

```txt
src/agent/providers/custom.ts
```

Example shape:

```ts
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function callCustomProvider(options: {
  apiKey: string;
  apiUrl: string;
  messages: ChatMessage[];
}): Promise<string> {
  const response = await fetch(options.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: options.messages
    })
  });

  if (!response.ok) {
    throw new Error(`Custom provider failed with status ${response.status}`);
  }

  const data = await response.json();

  return data.output_text ?? data.choices?.[0]?.message?.content ?? '';
}
```

---

### 4. Register the Provider

In the agent layer:

```ts
switch (provider) {
  case 'openai':
    return callOpenAIProvider(options);

  case 'rapidapi':
    return callRapidAPIProvider(options);

  case 'custom':
    return callCustomProvider(options);

  default:
    throw new Error(`Unsupported LLM provider: ${provider}`);
}
```

---

### 5. Keep the Same Output Contract

No matter which AI API is used, the model should return the same structured data.

Planner output:

```json
{
  "test_plan": [
    {
      "targetSurface": "Header Navigation",
      "viewport": "mobile",
      "checkType": "interaction",
      "reason": "Changed files include Header/Nav component."
    }
  ]
}
```

Summarizer output:

```json
{
  "findings": [
    {
      "title": "Focus restore fails when closing mobile nav",
      "summary": "Closing the mobile navigation throws a runtime error and focus does not return to the menu trigger.",
      "category": "interaction",
      "severity": "high",
      "confidence": 95,
      "suggestedCause": "The close handler likely assumes a focus ref is always defined."
    }
  ]
}
```

The rule is:

> The AI provider can change. The browser evidence contract should not.

---

## 📦 Installation

Create this workflow in your frontend repository:

```txt
.github/workflows/mergeguard-ui-qa.yml
```

```yaml
name: MergeGuard UI QA

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  frontend-qa:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Run MergeGuard UI
        uses: tabitha-dev/MergeGuard@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          preview-url: ${{ env.PREVIEW_URL }}
          mode: deterministic
          fail-on-severity: high

      - name: Upload MergeGuard Evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: mergeguard-evidence
          path: ./artifacts/
          retention-days: 14
```

---

## 🔐 Required GitHub Permissions

MergeGuard needs permission to read PR context and post a PR comment.

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

These permissions allow MergeGuard to:

- Read changed files
- Inspect pull request metadata
- Post or update the PR review comment

---

## ⚙️ Inputs

| Input | Required | Default | Description |
|---|---:|---|---|
| `github-token` | yes | none | GitHub token used to read PR metadata and post PR comments |
| `preview-url` | yes | none | Preview deployment URL to open in the browser |
| `mode` | no | `deterministic` | Use `deterministic` or `agentic` |
| `fail-on-severity` | no | `high` | Use `none`, `high`, `medium`, or `low` |
| `llm-provider` | no | `openai` | Model provider for agentic mode. Options: `openai` or `rapidapi` |
| `openai-api-key` | no | none | Optional OpenAI API key for agentic mode |
| `openai-model` | no | `gpt-4o-mini` | OpenAI model used in agentic mode |
| `rapidapi-key` | no | none | Optional RapidAPI key for agentic mode. Store it as a GitHub secret |
| `rapidapi-host` | no | `open-ai21.p.rapidapi.com` | RapidAPI host used when `llm-provider=rapidapi` |
| `rapidapi-endpoint` | no | `claude3` | RapidAPI endpoint used when `llm-provider=rapidapi` |

---

## 🧪 Deterministic Usage

Use this first.

```yaml
- name: Run MergeGuard UI
  uses: tabitha-dev/MergeGuard@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    preview-url: ${{ env.PREVIEW_URL }}
    mode: deterministic
    fail-on-severity: high
```

This mode is free to run inside GitHub Actions and does not require a model API key.

---

## 🤖 Agentic Usage with RapidAPI

Add your RapidAPI key as a GitHub Actions secret:

```txt
RAPIDAPI_KEY
```

Then use:

```yaml
- name: Run MergeGuard UI
  uses: tabitha-dev/MergeGuard@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    preview-url: ${{ env.PREVIEW_URL }}
    mode: agentic
    llm-provider: rapidapi
    rapidapi-key: ${{ secrets.RAPIDAPI_KEY }}
    rapidapi-host: open-ai21.p.rapidapi.com
    rapidapi-endpoint: claude3
    fail-on-severity: high
```

---

## 🤖 Agentic Usage with OpenAI

Add your OpenAI key as a GitHub Actions secret:

```txt
OPENAI_API_KEY
```

Then use:

```yaml
- name: Run MergeGuard UI
  uses: tabitha-dev/MergeGuard@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    preview-url: ${{ env.PREVIEW_URL }}
    mode: agentic
    llm-provider: openai
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    openai-model: gpt-4o-mini
    fail-on-severity: high
```

---

## 🧭 Preview URL Requirement

MergeGuard needs a working preview URL.

That preview URL can come from:

- Vercel
- Netlify
- Cloudflare Pages
- Render
- Fly.io
- Railway
- A locally started preview server inside the workflow

Example local preview server:

```yaml
- name: Start demo site
  run: |
    python3 -m http.server 4173 --directory examples/demo-site &
    sleep 3

- name: Run MergeGuard UI
  uses: tabitha-dev/MergeGuard@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    preview-url: http://127.0.0.1:4173
    mode: deterministic
    fail-on-severity: none
```

---

## 🧪 Included Self-Test

This repository includes a self-test workflow for validating the action against the demo site.

```txt
.github/workflows/self-test.yml
```

The demo site intentionally includes frontend issues so MergeGuard has something to find.

```txt
examples/demo-site/index.html
```

Intentional demo bugs:

- 📱 Mobile horizontal overflow
- ♿ Low contrast text
- ⌨️ Menu escape key focus bug
- 🧨 Form button runtime error

A successful self-test proves that MergeGuard can:

1. Start a demo preview server
2. Run the action
3. Open the page in Playwright
4. Capture browser evidence
5. Post a PR review comment
6. Upload artifacts

---

## 📁 Evidence Artifact Layout

MergeGuard saves evidence into:

```txt
artifacts/
├── run_summary.json
├── screenshots/
│   └── *.png
├── traces/
│   └── *.zip
├── logs/
│   └── *.json
└── a11y/
    └── *.json
```

These artifacts help developers reproduce and debug issues after the PR review comment is posted.

---

## 🧑‍💻 Local Development

Install dependencies:

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install --no-frozen-lockfile
```

Type check:

```bash
pnpm run check
```

Build TypeScript:

```bash
pnpm exec tsc
```

Install Playwright browsers locally:

```bash
pnpm exec playwright install chromium --with-deps
```

Run formatting:

```bash
pnpm run format
```

---

## 🚢 Release Checklist

Before publishing or updating a tag:

```bash
pnpm install --no-frozen-lockfile
pnpm run check
pnpm exec tsc
```

Commit changes:

```bash
git add .
git commit -m "Release MergeGuard UI"
git push origin main
```

Tag release:

```bash
git tag -f v1
git push origin v1 --force
```

Or update the release in GitHub UI:

```txt
Releases → v1 → delete old release/tag → create new v1 from main
```

---

## 🔒 Security Notes

- Never commit API keys
- Store `OPENAI_API_KEY` or `RAPIDAPI_KEY` as GitHub Actions secrets
- Rotate any key that was accidentally pasted into a chat, issue, PR, or commit
- Use deterministic mode when you do not need LLM planning
- Avoid running MergeGuard against destructive flows
- Use test accounts and safe preview environments

---

## ⚠️ Limitations

MergeGuard is designed to be high-signal, not exhaustive.

Current limitations:

- Automated accessibility scans do not prove full WCAG compliance
- Generic interaction probes work best when components use accessible roles, labels, and stable selectors
- The action needs a preview URL from the app or deployment provider
- Agentic mode requires a BYO model API key
- RapidAPI availability, pricing, and free-tier limits depend on the selected endpoint
- MergeGuard avoids destructive flows and real submissions
- It does not replace a full Playwright E2E suite, manual QA, or visual regression platform

---

## 🛣️ Roadmap

Planned improvements:

- 🧠 Richer agentic test planning
- 🖼️ Screenshot diff support
- 🧩 Custom selector configuration
- 🧪 User-defined critical flows
- 📊 Historical findings dashboard
- 🧵 Better inline GitHub annotations
- 🧰 Reusable check presets for forms, nav, modals, checkout, and auth
- 🧬 More provider adapters for model APIs

---

## 💼 Recruiter-Friendly Project Highlights

MergeGuard UI demonstrates practical frontend engineering beyond building screens.

It shows experience with:

- TypeScript system design
- GitHub Actions automation
- CI/CD workflow design
- Playwright browser automation
- Accessibility testing
- PR review automation
- Evidence-backed QA workflows
- Agentic AI integration
- API provider abstraction
- Developer tooling
- Runtime debugging

A concise resume-ready summary:

> Built MergeGuard UI, a reusable GitHub Action that acts as an agentic frontend QA reviewer. It reads pull request context, opens preview deployments with Playwright, runs targeted browser checks for layout, console, interaction, and accessibility issues, and posts evidence-backed PR review comments with artifacts before merge.

---

## 🛡️ Philosophy

MergeGuard follows one rule:

> **No evidence, no finding.**

Every issue must connect back to browser evidence such as:

- Screenshot
- Trace
- Console error
- Page error
- Network failure
- Accessibility violation
- Layout measurement
- Interaction failure

That makes the output useful for developers, not just impressive for demos.

---

## 📄 License

MIT
