import type { Page } from 'playwright';
import type { InteractionObservation } from './types.js';
import type { TestPlanItem } from '../schemas/test-plan.js';
import { describeActiveElement } from './selector.js';

const MENU_SELECTORS = [
  'button[aria-label*="menu" i]',
  'button[aria-label*="navigation" i]',
  'button[aria-expanded]',
  '[data-testid*="menu" i]',
  '[data-testid*="nav" i] button',
  'button:has-text("Menu")'
];

const MODAL_SELECTORS = [
  'button:has-text("Open")',
  'button:has-text("Details")',
  'button:has-text("View")',
  '[data-testid*="modal" i]',
  '[data-testid*="dialog" i]'
];

const FORM_SELECTORS = ['form input:not([type="hidden"])', 'form textarea', 'form select'];

async function firstVisibleSelector(page: Page, selectors: string[]): Promise<string | undefined> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    try {
      if ((await locator.count()) > 0 && (await locator.isVisible({ timeout: 600 }))) {
        return selector;
      }
    } catch {
      // Continue to the next selector.
    }
  }
  return undefined;
}

export async function runInteractionProbe(page: Page, item: TestPlanItem): Promise<InteractionObservation> {
  const attempted: string[] = [];
  const failures: string[] = [];
  const surface = `${item.targetSurface} ${item.reason}`.toLowerCase();
  const focusBefore = await describeActiveElement(page);

  if (surface.includes('nav') || surface.includes('menu') || surface.includes('header')) {
    const menuSelector = await firstVisibleSelector(page, [...item.selectors, ...MENU_SELECTORS]);
    if (!menuSelector) {
      failures.push('Could not find a visible navigation or menu trigger.');
    } else {
      attempted.push(`click ${menuSelector}`);
      const trigger = page.locator(menuSelector).first();
      await trigger.click({ timeout: 2_000 });
      await page.waitForTimeout(300);
      attempted.push('press Escape');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  } else if (surface.includes('modal') || surface.includes('dialog')) {
    const modalSelector = await firstVisibleSelector(page, [...item.selectors, ...MODAL_SELECTORS]);
    if (!modalSelector) {
      failures.push('Could not find a visible modal or dialog trigger.');
    } else {
      attempted.push(`click ${modalSelector}`);
      await page.locator(modalSelector).first().click({ timeout: 2_000 });
      await page.waitForTimeout(300);
      const dialogCount = await page.locator('[role="dialog"], dialog, [aria-modal="true"]').count();
      if (dialogCount === 0) failures.push('No dialog appeared after trigger click.');
      attempted.push('press Escape');
      await page.keyboard.press('Escape');
    }
  } else if (surface.includes('form') || surface.includes('input') || surface.includes('checkout')) {
    const inputSelector = await firstVisibleSelector(page, [...item.selectors, ...FORM_SELECTORS]);
    if (!inputSelector) {
      failures.push('Could not find a visible form input to probe.');
    } else {
      attempted.push(`focus ${inputSelector}`);
      await page.locator(inputSelector).first().focus({ timeout: 2_000 });
      attempted.push('type test value');
      await page.keyboard.type('mergeguard-test');
    }
  } else {
    attempted.push('generic tab navigation');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
  }

  const focusAfter = await describeActiveElement(page);
  return { attempted, failures, focusBefore, focusAfter };
}
