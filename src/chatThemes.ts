import { ChatTheme, THEMES_PART1 } from './themes/themesPart1';
import { THEMES_PART2 } from './themes/themesPart2';

export type { ChatTheme };

export const CHAT_THEMES: ChatTheme[] = [
  ...THEMES_PART1,
  ...THEMES_PART2
];

export const DEFAULT_THEME_ID = 'minimal_clean_slate';

export function getThemeById(id?: string): ChatTheme {
  const found = CHAT_THEMES.find(t => t.id === id);
  return found || CHAT_THEMES[0];
}
