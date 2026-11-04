import { useRenderer, useSources } from '@ws-ui/webform-editor';
import { type FC, useEffect, useMemo, useRef } from 'react';

import {
  clickTarget,
  focusTarget,
  type IShortcut,
  moveInList,
  openRow,
  toSelector,
  trackLists,
} from './actions';
import type { IKeyboardShortcutsProps } from './KeyboardShortcuts.config';
import { allowedWhileTyping, type ICombo, isTyping, matches, parseShortcut } from './keys';

interface IScalarSource {
  setValue(path: null, value: unknown): Promise<void> | void;
}

// The focused element is inside the element(s) matching `when`
const focusIsIn = (when: string) => {
  try {
    return !!(document.activeElement as Element | null)?.closest(toSelector(when.trim()));
  } catch {
    return false;
  }
};

const SEQUENCE_DELAY = 1000; // ms between the keys of a sequence ("g b")

// Listens to the keyboard while the page is shown. Renders nothing visible.
const KeyboardShortcuts: FC<IKeyboardShortcutsProps> = ({ shortcuts = [] }) => {
  const { connect, emit } = useRenderer();
  const {
    sources: { datasource },
  } = useSources();
  const ds = datasource as unknown as IScalarSource | undefined;

  const parsed = useMemo(
    () =>
      shortcuts
        .filter((s) => !s.disabled && s.keys)
        .map((s) => ({ shortcut: s, steps: parseShortcut(s.keys) }))
        .filter((s) => s.steps.length > 0),
    [shortcuts],
  );

  // latest values for the window listener, which is installed once
  const ref = useRef({ parsed, emit, ds });
  ref.current = { parsed, emit, ds };

  useEffect(() => {
    let pending: { steps: ICombo[]; shortcut: IShortcut }[] = [];
    let position = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resetSequence = () => {
      pending = [];
      position = 0;
    };

    const run = async (shortcut: IShortcut): Promise<boolean> => {
      switch (shortcut.action) {
        case 'focus':
          return focusTarget(shortcut.target);
        case 'click':
          return clickTarget(shortcut.target);
        case 'openRow':
          return openRow(shortcut.target);
        case 'nextRow':
        case 'previousRow':
        case 'nextItem':
        case 'previousItem':
          return moveInList(
            shortcut.target,
            shortcut.action.startsWith('next') ? 1 : -1,
            shortcut.action.endsWith('Row'),
          );
        default: {
          const { ds: source, emit: fire } = ref.current;
          const name = shortcut.id || shortcut.keys;
          if (source) await source.setValue(null, name);
          fire('onshortcut', { id: name, keys: shortcut.keys });
          return true;
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && !/^Arrow/.test(e.key)) return;
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      const typing = isTyping(e);
      const candidates = (position > 0 ? pending : ref.current.parsed).filter(
        ({ steps, shortcut }) =>
          matches(steps[position], e) &&
          (shortcut.when
            ? focusIsIn(shortcut.when) // scoped to a field: fires while typing in it
            : !typing || allowedWhileTyping(steps[position])),
      );
      clearTimeout(timer);
      if (candidates.length === 0) {
        resetSequence();
        return;
      }
      // every row with these keys runs, in order (e.g. click "More filters", then focus the search field)
      const done = candidates.filter(({ steps }) => steps.length === position + 1);
      if (done.length > 0) {
        resetSequence();
        // a matched shortcut replaces the browser's default (⌘K address bar, arrow scrolling)
        e.preventDefault();
        e.stopPropagation();
        (async () => {
          for (const { shortcut } of done) await run(shortcut);
        })();
        return;
      }
      e.preventDefault();
      pending = candidates;
      position += 1;
      timer = setTimeout(resetSequence, SEQUENCE_DELAY);
    };

    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', trackLists, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', trackLists, true);
    };
  }, []);

  return <div ref={connect} style={{ display: 'none' }} />;
};

export default KeyboardShortcuts;
