# MergeGuard UI

MergeGuard UI is a reusable GitHub Action that acts like an agentic frontend reviewer. It reads a pull request, opens the preview deployment in Playwright, runs targeted browser checks, captures evidence, and posts a human-readable PR review before merge.

> Positioning line: an agentic frontend reviewer that uses browser context to validate UI changes before merge.

## What it checks

MergeGuard focuses on high-signal browser evidence:

- Console errors and runtime page errors
- Failed network requests and 5xx responses
- Responsive layout overflow on mobile and desktop
- Automated accessibility findings from Axe
- Basic interaction probes for navigation, modals, forms, and keyboard flow
- Screenshots, traces, logs, and JSON evidence saved as GitHub Actions artifacts

It is intentionally not a full regression crawler. The goal is to test changed surfaces, not the entire app.

## Why this project matters

Most PR checks are static. MergeGuard adds browser context. It validates the actual preview app and reports issues like:

- Mobile nav closes before focus returns
- Checkout CTA is clipped at 390px
- Dark mode contrast regressed
- A component throws a runtime error after interaction
- A form change removed accessible labels

Every finding must be tied to concrete evidence.

## Install in a repo

Create `.github/workflows/mergeguard-ui-qa.yml`:

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
  agentic-qa:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Playwright browser
        run: npx playwright install chromium --with-deps

      # Your deploy provider should export PREVIEW_URL before this step.
      - name: Run MergeGuard Agent
        uses: tabitha-dev/MergeGuard@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          preview-url: ${{ env.PREVIEW_URL }}
          mode: deterministic
          fail-on-severity: high

      - name: Upload Evidence Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: mergeguard-evidence
          path: ./artifacts/
          retention-days: 14
```

## Inputs

| Input | Required | Default | Description |
|---|---:|---|---|
| `github-token` | yes | none | Token used to read PR metadata and post/update comments. |
| `preview-url` | yes | none | Preview deployment URL to test. |
| `openai-api-key` | no | none | Optional OpenAI key for agentic planning and summarization. |
| `rapidapi-key` | no | none | Optional RapidAPI key for agentic planning and summarization. Store it as a GitHub secret. |
| `rapidapi-host` | no | `open-ai21.p.rapidapi.com` | RapidAPI host used when `llm-provider=rapidapi`. |
| `rapidapi-endpoint` | no | `claude3` | RapidAPI endpoint used when `llm-provider=rapidapi`; for example `claude3` or `conversationllama`. |
| `llm-provider` | no | `openai` | Use `openai` or `rapidapi` when `mode=agentic`. |
| `mode` | no | `deterministic` | Use `deterministic` or `agentic`. |
| `fail-on-severity` | no | `high` | Use `none`, `high`, `medium`, or `low`. |
| `artifact-dir` | no | `./artifacts` | Directory where evidence is saved. |
| `model` | no | `gpt-4o-mini` | Model used for agentic mode. |
| `comment-marker` | no | `<!-- mergeguard-ui-review -->` | Hidden marker used to update the same PR comment. |

## Modes

### Deterministic mode

Deterministic mode requires no model API key. It maps changed files to test plans using local rules.

Examples:

- `Nav.tsx` or `Header.tsx` triggers navigation interaction, layout, accessibility, and console checks.
- `Form.tsx`, `Login.tsx`, or `Checkout.tsx` triggers form interaction, accessibility, and console checks.
- `dark-mode.css`, `theme.ts`, or `tokens.css` triggers contrast and layout checks.
- CSS and layout files trigger responsive screenshots and overflow checks.

### Agentic mode

Agentic mode uses the model only at bounded decision points:

1. Planner: changed files to test plan
2. Summarizer: raw browser evidence to structured findings

The browser execution remains deterministic and evidence-bound.

If the model fails or returns invalid output, MergeGuard falls back to deterministic mode.

## Local development

```bash
npm install
npm run playwright:install
npm run check
npm run build
```

The action must be released with `dist/index.js` committed because JavaScript GitHub Actions run from the compiled distribution file.

## Release checklist

```bash
npm install
npm run release:check
git add action.yml src package.json tsconfig.json README.md dist
git commit -m "Release MergeGuard UI action"
git tag v1
git push origin main --tags
```

## Evidence artifact layout

```txt
artifacts/
├── run_summary.json
├── screenshots/
├── traces/
├── logs/
└── a11y/
```

## Example PR comment

```md
## MergeGuard UI Review

Preview tested: https://preview.example.com
Commit: `abc123`
Mode: `agentic`
Model: `rapidapi:claude3` or `gpt-4o-mini`
Duration: 42.0s

### Summary

Found 2 evidence-backed issue(s): 1 high, 1 medium, 0 low.

| Severity | Category | Finding | Confidence |
|---|---|---|---:|
| 🔴 high | interaction | Mobile nav focus restore fails | 95% |
| 🟠 medium | accessibility | Dark mode contrast regression | 88% |
```

## Limitations

- Automated accessibility scans do not prove full WCAG compliance.
- Generic interaction probes work best when components use accessible roles, labels, and stable selectors.
- MergeGuard avoids destructive flows and real submissions.
- The action needs a preview URL from your hosting provider.
- Agentic mode is BYO model key. Deterministic mode is free and self-contained in GitHub Actions.

## Project structure

```txt
mergeguard-action/
├── action.yml
├── src/
│   ├── index.ts
│   ├── agent/
│   ├── browser-runner/
│   ├── github/
│   ├── reporting/
│   ├── risk-engine/
│   ├── schemas/
│   └── util/
├── examples/
│   ├── workflows/
│   └── demo-site/
├── package.json
└── tsconfig.json
```

## Demo idea

Use the included `examples/demo-site/index.html` as a small bug target. It intentionally contains:

- Mobile horizontal overflow
- Low contrast text
- A menu escape key focus bug
- A form button runtime error

This gives you a clear two-minute walkthrough:

1. Open a PR with the bug.
2. GitHub Action runs.
3. MergeGuard builds a focused test plan.
4. Playwright opens the preview.
5. PR comment appears with screenshots, traces, logs, confidence, and suggested causes.
