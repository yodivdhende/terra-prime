import { WINDOW_SERVICE } from './window-service.svelte';

function createIconService() {
  const icons = $derived.by(() => {
    const icons = WINDOW_SERVICE.windows.map(window => {
      console.log('creating Icon', window);
      if (window.icon == null) return null;
      return {
        windowId: window.id,
        title: window.title,
        type: window.icon!.type,
      }
    }).filter(value => value != null);

    console.log('icons', icons);
    return icons;
  }
  )

  return {
    icons,
  }
}

export const ICON_SERVICE = createIconService();

