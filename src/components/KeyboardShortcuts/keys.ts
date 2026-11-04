// Parsing and matching of shortcut definitions: "mod+k", "ctrl+shift+f", "escape", "arrowdown", "g b" (a sequence)

export interface ICombo {
  key: string; // KeyboardEvent.key, lower case ("k", "arrowdown", "escape", "?")
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean | null; // null: not stated, ignored for symbols ("?" needs shift on most layouts)
}

const ALIASES: Record<string, string> = {
  esc: 'escape',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  return: 'enter',
  del: 'delete',
  space: ' ',
  spacebar: ' ',
  plus: '+',
  cmd: 'meta',
  command: 'meta',
  control: 'ctrl',
  option: 'alt',
};

export const isMac = (): boolean =>
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

// "mod+k" -> one combo; "g b" -> a sequence of two combos
export function parseShortcut(text: string): ICombo[] {
  return (text || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseCombo)
    .filter((c): c is ICombo => c !== null);
}

function parseCombo(text: string): ICombo | null {
  // "+" alone or as the last part ("ctrl++") is the plus key
  const parts = text.endsWith('++')
    ? [...text.slice(0, -2).split('+'), '+']
    : text === '+'
      ? ['+']
      : text.split('+');
  const combo: ICombo = { key: '', ctrl: false, meta: false, alt: false, shift: null };
  for (const raw of parts) {
    const part = ALIASES[raw] ?? raw;
    if (part === 'mod') {
      if (isMac()) combo.meta = true;
      else combo.ctrl = true;
    } else if (part === 'ctrl') combo.ctrl = true;
    else if (part === 'meta') combo.meta = true;
    else if (part === 'alt') combo.alt = true;
    else if (part === 'shift') combo.shift = true;
    else combo.key = part;
  }
  return combo.key ? combo : null;
}

const isLetter = (key: string) => /^[a-z]$/.test(key);

export function matches(combo: ICombo, e: KeyboardEvent): boolean {
  if (e.ctrlKey !== combo.ctrl || e.metaKey !== combo.meta || e.altKey !== combo.alt) return false;
  const key = (ALIASES[e.key.toLowerCase()] ?? e.key.toLowerCase()) || '';
  // Letters and named keys: shift must be as stated (absent = not pressed). Symbols ("?", "/"): shift is ignored
  if (
    combo.shift !== null
      ? e.shiftKey !== combo.shift
      : (isLetter(combo.key) || combo.key.length > 1) && e.shiftKey
  ) {
    return false;
  }
  if (key === combo.key) return true;
  // Alt+letter gives another character on macOS ("˚" for alt+k): compare the physical key
  const code = e.code || '';
  return (
    (code.startsWith('Key') && code.slice(3).toLowerCase() === combo.key) ||
    (code.startsWith('Digit') && code.slice(5) === combo.key)
  );
}

// Typing in a field: only combos with ctrl / meta / alt, and Escape, fire
export function isTyping(e: KeyboardEvent): boolean {
  const el = (e.composedPath?.()[0] ?? e.target) as HTMLElement | null;
  if (!el || !(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export const allowedWhileTyping = (combo: ICombo): boolean =>
  combo.ctrl || combo.meta || combo.alt || combo.key === 'escape';

// "mod+shift+k" -> "⌘⇧K" on macOS, "Ctrl+Shift+K" elsewhere (shown in the editor)
export function displayShortcut(text: string): string {
  const mac = isMac();
  return parseShortcut(text)
    .map((c) => {
      const names: Record<string, string> = {
        arrowup: '↑',
        arrowdown: '↓',
        arrowleft: '←',
        arrowright: '→',
        escape: 'Esc',
        enter: '↵',
        ' ': 'Space',
      };
      const key = names[c.key] ?? (c.key.length === 1 ? c.key.toUpperCase() : c.key);
      const mods = mac
        ? `${c.ctrl ? '⌃' : ''}${c.alt ? '⌥' : ''}${c.shift ? '⇧' : ''}${c.meta ? '⌘' : ''}`
        : [c.ctrl && 'Ctrl', c.meta && 'Win', c.alt && 'Alt', c.shift && 'Shift']
            .filter(Boolean)
            .join('+');
      return mac ? mods + key : mods ? `${mods}+${key}` : key;
    })
    .join(' ');
}
