import { WINDOW_SERVICE } from './window-service.svelte';

function createIconService() {
  const icons = $derived(WINDOW_SERVICE.windows.map(window => {
    if (window.icon == null) return null;
    return {
      windowId: window.id,
      title: window.title,
      type: window.icon!.type,
    }
  }).filter(value => value != null))

  return {
    get icons() { return icons }
  }
}

export const ICON_SERVICE = createIconService();

