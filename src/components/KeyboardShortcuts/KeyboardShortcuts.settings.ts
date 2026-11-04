import {
  BASIC_SETTINGS,
  DEFAULT_SETTINGS,
  ESetting,
  load,
  type TSetting,
} from '@ws-ui/webform-editor';

const shortcutColumns: TSetting[] = [
  { key: 'keys', label: 'Keys', type: ESetting.TEXT_FIELD, placeholder: 'mod+k, g b, arrowdown' },
  {
    key: 'action',
    label: 'Action',
    type: ESetting.SELECT,
    defaultValue: 'focus',
    options: [
      { value: 'focus', label: 'Focus an element' },
      { value: 'click', label: 'Click an element' },
      { value: 'event', label: 'Fire On Shortcut' },
      { value: 'nextRow', label: 'Next row (list)' },
      { value: 'previousRow', label: 'Previous row (list)' },
      { value: 'nextItem', label: 'Next item (list)' },
      { value: 'previousItem', label: 'Previous item (list)' },
      { value: 'openRow', label: 'Open selected row (list)' },
    ],
  },
  {
    key: 'target',
    label: 'Target (CSS class)',
    type: ESetting.TEXT_FIELD,
    placeholder: 'searchBox or .list',
  },
  { key: 'id', label: 'Name (On Shortcut)', type: ESetting.TEXT_FIELD, placeholder: 'newBooking' },
  {
    key: 'when',
    label: 'Only when focus is in',
    type: ESetting.TEXT_FIELD,
    placeholder: 'searchBox (fires while typing there)',
  },
  { key: 'disabled', label: 'Disabled', type: ESetting.CHECKBOX },
];

const dataSettings: TSetting[] = [
  {
    key: 'shortcuts',
    name: 'shortcuts',
    label: 'Shortcuts',
    type: ESetting.DATAGRID,
    titleProperty: 'keys',
    data: shortcutColumns,
  },
  { key: 'datasource', label: 'Last shortcut (string)', type: ESetting.DS_AUTO_SUGGEST },
];

const Settings: TSetting[] = [
  { key: 'data', label: 'Shortcuts', type: ESetting.GROUP, components: dataSettings },
  ...DEFAULT_SETTINGS,
];

export const BasicSettings: TSetting[] = [
  ...dataSettings,
  ...load(BASIC_SETTINGS).filter('style.overflow'),
];

export default Settings;
