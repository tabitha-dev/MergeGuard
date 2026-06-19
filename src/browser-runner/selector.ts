import type { Page } from 'playwright';

export async function describeActiveElement(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return 'none';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const aria = el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label')}"]` : '';
    const testid = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
    return `${tag}${id}${aria}${testid}`;
  });
}

export async function elementFingerprint(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return sel;
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const testid = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
    const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : '';
    return `${tag}${id}${testid}${role}`;
  }, selector);
}
