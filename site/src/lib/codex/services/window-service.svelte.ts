function createWindowService() {
  const windows = $state([]);
  const openWindows = $derived(windows.filter(window => window.state === 'open'));

  return {
    openWindows,

  }
}

export const windowService = createWindowService();
export type Window = {
  id: string;
  state: 'open' | 'hidden' | 'closed';
}
