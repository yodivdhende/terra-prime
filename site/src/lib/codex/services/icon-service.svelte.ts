import { WINDOW_SERVICE } from './window-service.svelte';

export type Icon = {
  windowId: string;
  title: string;
  type: 'file' | 'dir' | 'image' | 'settings' | 'playtest';
  side: 'left' | 'right';
}

function createIconService() {
  const icons = $derived(WINDOW_SERVICE.windows.map(window => {
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

export const ICON_SERVICE = createIconService();

