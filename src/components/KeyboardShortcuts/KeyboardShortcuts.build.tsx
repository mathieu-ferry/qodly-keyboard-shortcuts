import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import type { FC } from 'react';
import { MdKeyboard } from 'react-icons/md';

import type { IKeyboardShortcutsProps } from './KeyboardShortcuts.config';
import { displayShortcut } from './keys';

const LABELS: Record<string, string> = {
  focus: 'focus',
  click: 'click',
  event: 'On Shortcut',
  nextRow: 'next row',
  previousRow: 'previous row',
  nextItem: 'next item',
  previousItem: 'previous item',
  openRow: 'open row',
};

// Canvas: a small chip listing the shortcuts (invisible at runtime)
const KeyboardShortcuts: FC<IKeyboardShortcutsProps> = ({
  shortcuts = [],
  style,
  className,
  classNames = [],
}) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();

  return (
    <div
      ref={connect}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        border: '1px dashed #98A2B3',
        borderRadius: 8,
        fontSize: 12,
        color: '#344054',
        ...style,
      }}
      className={cn(className, classNames)}
    >
      <MdKeyboard size={16} />
      {shortcuts.length === 0
        ? 'Keyboard shortcuts: add them in the properties'
        : shortcuts.map((s) => (
            <span
              key={`${s.keys}|${s.action}|${s.target ?? ''}|${s.id ?? ''}`}
              style={{ opacity: s.disabled ? 0.4 : 1 }}
            >
              <kbd
                style={{
                  padding: '0 4px',
                  border: '1px solid #D0D5DD',
                  borderRadius: 4,
                  background: '#F8FAFC',
                  fontFamily: 'inherit',
                }}
              >
                {displayShortcut(s.keys) || '?'}
              </kbd>{' '}
              {LABELS[s.action] ?? s.action}
              {s.target ? ` ${s.target}` : ''}
            </span>
          ))}
    </div>
  );
};

export default KeyboardShortcuts;
