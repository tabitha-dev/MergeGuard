import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { BrowserCheckResult, BrowserRunOptions, ConsoleRecord, NetworkFailure } from './types.js';
import { viewportSize } from '../schemas/test-plan.js';
import { resolveTargetUrl } from './url.js';
import { inspectLayout } from './layout.js';
import { runInteractionProbe } from './interaction.js';
import { runA11yScan } from './a11y.js';
import { slugify, writeJson } from '../util/fs.js';

async function ensureRunnerDirs(artifactDir: string): Promise<void> {
  await fs.mkdir(path.join(artifactDir, 'screenshots'), { recursive: true });
  await fs.mkdir(path.join(artifactDir, 'traces'), { recursive: true });
  await fs.mkdir(path.join(artifactDir, 'logs'), { recursive: true });
  await fs.mkdir(path.join(artifactDir, 'a11y'), { recursive: true });
}

export async function runBrowserChecks(options: BrowserRunOptions): Promise<BrowserCheckResult[]> {
  await ensureRunnerDirs(options.artifactDir);

  const chromiumExecutablePath =
    process.env.MERGEGUARD_CHROMIUM_EXECUTABLE_PATH ||
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumExecutablePath || undefined
  });

  const results: BrowserCheckResult[] = [];

  try {
    for (const item of options.testPlan) {
      const started = Date.now();
      const size = viewportSize(item.viewport);
      const url = resolveTargetUrl(options.previewUrl, item.route);
      const slug = slugify(`${item.targetSurface}-${item.viewport}-${item.checkType}`);
      const consoleMessages: ConsoleRecord[] = [];
      const pageErrors: string[] = [];
      const networkFailures: NetworkFailure[] = [];
      const notes: string[] = [];
      const evidence: BrowserCheckResult['evidence'] = [];

      const context = await browser.newContext({ viewport: size });
      const page = await context.newPage();
      const tracePath = path.join(options.artifactDir, 'traces', `${slug}.zip`);
      const screenshotPath = path.join(options.artifactDir, 'screenshots', `${slug}.png`);
      const logPath = path.join(options.artifactDir, 'logs', `${slug}.json`);
      const a11yPath = path.join(options.artifactDir, 'a11y', `${slug}.json`);

      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

      page.on('console', (message) => {
        const type = message.type();
        if (['error', 'warning'].includes(type)) {
          consoleMessages.push({
            type,
            text: message.text(),
            location: message.location()?.url
          });
        }
      });

      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      page.on('requestfailed', (request) => {
        networkFailures.push({
          url: request.url(),
          method: request.method(),
          failureText: request.failure()?.errorText
        });
      });

      page.on('response', (response) => {
        if (response.status() >= 500) {
          networkFailures.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status()
          });
        }
      });

      let axeViolations: BrowserCheckResult['axeViolations'] = [];
      let layout: BrowserCheckResult['layout'];
      let interaction: BrowserCheckResult['interaction'];
      let status: BrowserCheckResult['status'] = 'passed';

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

        try {
          await page.waitForLoadState('networkidle', { timeout: 5_000 });
        } catch {
          notes.push('Network did not become idle within 5 seconds. Continuing checks.');
        }

        if (item.checkType === 'accessibility') {
          axeViolations = await runA11yScan(page);
          await writeJson(a11yPath, axeViolations);
          evidence.push({
            type: 'json',
            localPath: a11yPath,
            note: 'Axe accessibility scan result'
          });
        }

        if (['layout', 'visual'].includes(item.checkType)) {
          layout = await inspectLayout(page);
        }

        if (item.checkType === 'interaction') {
          interaction = await runInteractionProbe(page, item);
        }

        if (item.checkType === 'console') {
          notes.push('Console and page errors were captured during page load.');
        }

        await page.screenshot({ path: screenshotPath, fullPage: true });
        evidence.push({
          type: 'screenshot',
          localPath: screenshotPath,
          note: `${item.viewport} screenshot`
        });

        if (
          pageErrors.length > 0 ||
          consoleMessages.some((record) => record.type === 'error') ||
          networkFailures.length > 0 ||
          axeViolations.some((violation) => ['critical', 'serious'].includes(violation.impact ?? '')) ||
          layout?.hasHorizontalOverflow ||
          (interaction?.failures.length ?? 0) > 0
        ) {
          status = 'failed';
        } else if (consoleMessages.length > 0 || axeViolations.length > 0 || notes.length > 0) {
          status = 'warning';
        }
      } catch (error) {
        status = 'failed';
        pageErrors.push(error instanceof Error ? error.message : String(error));
      } finally {
        await context.tracing.stop({ path: tracePath }).catch(() => undefined);
        evidence.push({
          type: 'trace',
          localPath: tracePath,
          note: 'Playwright trace'
        });

        const raw = {
          item,
          url,
          status,
          consoleMessages,
          pageErrors,
          networkFailures,
          axeViolations,
          layout,
          interaction,
          notes
        };

        await writeJson(logPath, raw);
        evidence.push({
          type: 'log',
          localPath: logPath,
          note: 'Raw browser check log'
        });

        await context.close().catch(() => undefined);
      }

      results.push({
        item,
        url,
        status,
        durationMs: Date.now() - started,
        consoleMessages,
        pageErrors,
        networkFailures,
        axeViolations,
        layout,
        interaction,
        evidence,
        notes
      });
    }
  } finally {
    await browser.close().catch(() => undefined);
  }

  return results;
}