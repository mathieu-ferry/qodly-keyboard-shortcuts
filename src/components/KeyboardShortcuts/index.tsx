import { type T4DComponent, useEnhancedEditor } from '@ws-ui/webform-editor';
import Build from './KeyboardShortcuts.build';
import config, { type IKeyboardShortcutsProps } from './KeyboardShortcuts.config';
import Render from './KeyboardShortcuts.render';

const KeyboardShortcuts: T4DComponent<IKeyboardShortcutsProps> = (props) => {
  const { enabled } = useEnhancedEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return enabled ? <Build {...props} /> : <Render {...props} />;
};

KeyboardShortcuts.craft = config.craft;
KeyboardShortcuts.info = config.info;
KeyboardShortcuts.defaultProps = config.defaultProps;

export default KeyboardShortcuts;
