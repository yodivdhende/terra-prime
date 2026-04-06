function createWindowService() {
  let windows = $state([] as CodexWindow[]);
  const openWindows = $derived(windows.filter(window => window.state === 'open'));

  function openWindow(id: string) {
    windows = windows.map(window => {
      if (window.id === id) window.state = 'open';
      return window
    })
  }

  return {
    openWindows,
    openWindow,

  }
}

export const windowService = createWindowService();

export type CodexWindow = {
  id: string;
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  content: string;
}
