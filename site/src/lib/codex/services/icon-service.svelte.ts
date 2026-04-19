import { WINDOW_SERVICE } from './window-service.svelte';

function createIconService() {
  const icons = $derived.by(() =>
    WINDOW_SERVICE.windows
      .filter(({ icon }) => icon != null)
      .map(window => ({
        windowId: window.id,
        title: window.title,
        type: window.icon!.type,
      }))
  )

  return {
    icons,
  }
}

export const ICON_SERVICE = createIconService();

