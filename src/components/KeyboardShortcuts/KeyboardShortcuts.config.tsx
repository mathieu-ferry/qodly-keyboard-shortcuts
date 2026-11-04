import { EComponentKind, Settings, type T4DComponentConfig } from '@ws-ui/webform-editor';
import { MdKeyboard } from 'react-icons/md';

import type { IShortcut } from './actions';
import KeyboardShortcutsSettings, { BasicSettings } from './KeyboardShortcuts.settings';

export default {
  craft: {
    displayName: 'KeyboardShortcuts',
    kind: EComponentKind.BASIC,
    props: {
      name: '',
      classNames: [],
      events: [],
    },
    related: {
      settings: Settings(KeyboardShortcutsSettings, BasicSettings),
    },
  },
  info: {
    settings: KeyboardShortcutsSettings,
    displayName: 'Keyboard shortcuts',
    exposed: true,
    icon: MdKeyboard,
    events: [{ label: 'On Shortcut', value: 'onshortcut' }],
    datasources: {
      accept: ['string'],
    },
  },
  defaultProps: {
    shortcuts: [],
    style: {},
  },
} as T4DComponentConfig<IKeyboardShortcutsProps>;

export interface IKeyboardShortcutsProps extends webforms.ComponentProps {
  shortcuts?: IShortcut[];
}
