import type { CheckType, ViewportName } from '../schemas/test-plan.js';

export type RiskRule = {
  name: string;
  patterns: RegExp[];
  surface: string;
  viewports: ViewportName[];
  checks: CheckType[];
  reason: string;
  selectors?: string[];
};

export const riskRules: RiskRule[] = [
  {
    name: 'navigation',
    patterns: [/nav/i, /navbar/i, /header/i, /menu/i, /drawer/i, /sidebar/i],
    surface: 'Navigation',
    viewports: ['mobile', 'desktop'],
    checks: ['interaction', 'layout', 'accessibility', 'console'],
    reason: 'Navigation changes often affect focus handling, responsive layout, and keyboard behavior.',
    selectors: ['button[aria-expanded]', 'button[aria-label*="menu" i]', 'nav']
  },
  {
    name: 'forms',
    patterns: [/form/i, /input/i, /select/i, /textarea/i, /checkout/i, /signup/i, /login/i, /auth/i],
    surface: 'Form flow',
    viewports: ['mobile', 'desktop'],
    checks: ['interaction', 'accessibility', 'console'],
    reason: 'Form changes can break keyboard focus, labels, validation, and submission behavior.',
    selectors: ['form', 'input', 'button[type="submit"]']
  },
  {
    name: 'modals',
    patterns: [/modal/i, /dialog/i, /popover/i, /tooltip/i, /toast/i, /overlay/i],
    surface: 'Dialog or overlay',
    viewports: ['mobile', 'desktop'],
    checks: ['interaction', 'accessibility', 'layout'],
    reason: 'Overlay changes can regress focus traps, escape behavior, z-index, and accessible names.',
    selectors: ['[role="dialog"]', 'dialog', '[aria-modal="true"]']
  },
  {
    name: 'theme',
    patterns: [/dark/i, /theme/i, /color/i, /tokens/i, /tailwind/i, /css/i, /scss/i, /sass/i],
    surface: 'Theme and visual system',
    viewports: ['mobile', 'desktop'],
    checks: ['accessibility', 'layout', 'visual'],
    reason: 'Theme and CSS changes can introduce contrast and responsive regressions.'
  },
  {
    name: 'layout',
    patterns: [/layout/i, /grid/i, /container/i, /section/i, /card/i, /hero/i, /page/i],
    surface: 'Page layout',
    viewports: ['mobile', 'desktop'],
    checks: ['layout', 'visual', 'console'],
    reason: 'Layout changes can cause clipping, overflow, or broken responsive behavior.'
  },
  {
    name: 'loading-state',
    patterns: [/loading/i, /skeleton/i, /spinner/i, /state/i, /store/i, /query/i, /api/i],
    surface: 'State and loading behavior',
    viewports: ['desktop'],
    checks: ['console', 'interaction'],
    reason: 'State changes can produce runtime errors or missing loading/error states.'
  }
];
