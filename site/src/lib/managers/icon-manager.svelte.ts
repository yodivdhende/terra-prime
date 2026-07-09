import { WINDOW_MANAGER } from './window-manager.svelte';
import type { Icon as WindowIcon } from './window-factories';

export type Icon = {
  windowId: string;
  title: string;
  type: WindowIcon['type'];
  side: 'left' | 'right';
}

function createIconManager() {
  const icons = $derived(WINDOW_MANAGER.windows.map(window => {
    if (window.icon == null) return null;
    return {
      windowId: window.id,
      title: window.title,
      type: window.icon!.type,
      side: window.icon!.side,
    } satisfies Icon;
  }).filter(value => value != null))

  return {
    get icons() { return icons }
  }
}

export const ICON_MANAGER = createIconManager();
