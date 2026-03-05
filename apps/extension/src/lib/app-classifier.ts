import type { TrackedApp } from '../types/events';

const APP_RULES: { pattern: RegExp; app: TrackedApp }[] = [
  { pattern: /^https?:\/\/(app\.joinbreasy\.com|.*\.bubbleapps\.io|.*\.bubble\.io)/, app: 'bubble' },
  { pattern: /^https?:\/\/mail\.google\.com/, app: 'gmail' },
  { pattern: /^https?:\/\/(app\.)?dialpad\.com/, app: 'dialpad' },
  { pattern: /^https?:\/\/app\.melio\.com/, app: 'melio' },
];

export function classifyUrl(url: string): TrackedApp {
  for (const rule of APP_RULES) {
    if (rule.pattern.test(url)) return rule.app;
  }
  return 'other';
}

export function isTrackedApp(app: TrackedApp): boolean {
  return app !== 'other';
}
