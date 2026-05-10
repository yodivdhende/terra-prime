import {
  createSettingsWindow,
  createPlaytestWindow,
  createLoginWindow,
  createFolderWindow,
  createPdfWindow,
  createDocWindow,
  createImageWindow,
  type CodexWindow,
} from './window-factories';

export type { CodexWindow, Icon } from './window-factories';

function createWindowService() {
  const windows = $state([createSettingsWindow(), createPlaytestWindow()] as CodexWindow[]);

  function setLoginEnabled(enabled: boolean) {
    const exists = windows.some(w => w.id === 'login');
    if (enabled && !exists) {
      windows.push(createLoginWindow());
    } else if (!enabled && exists) {
      const index = windows.findIndex(w => w.id === 'login');
      if (index >= 0) windows.splice(index, 1);
    }
  }

  function addWindows(items: { name: string, mimeType: string, id: string }[]): void {
    items.filter(item => windows.every(window => window.id != item.id))
      .forEach((item) => {
        const windowIndex = windows.findIndex(window => window.id === item.id);
        if (windowIndex >= 0) return

        if (item.mimeType.includes('folder')) {
          windows.push(
            createFolderWindow({ name: item.name, index: windows.length, id: item.id, side: 'right' })
          )
          return;
        }
        if (item.mimeType.includes('pdf')) {
          windows.push(
            createPdfWindow({ name: item.name, index: windows.length, id: item.id, side: 'right' })
          )
          return;
        }
        if (item.mimeType.includes('document')) {
          windows.push(
            createDocWindow({ name: item.name, index: windows.length, id: item.id, side: 'right' })
          )
          return;
        }
        if (item.mimeType.includes('image')) {
          windows.push(
            createImageWindow({ name: item.name, index: windows.length, id: item.id, side: 'right' })
          )
          return;
        }
      })
  }

  function openWindow({ id }: { id: CodexWindow['id'] }) {
    return updateStateToOpen(id);
  }

  function updateStateToOpen(id: CodexWindow['id']): string {
    const selectedWindow = windows.find(window => window.id === id);
    if (selectedWindow == null) return id;
    selectedWindow.state = 'open';
    return id;
  }

  function closeWindow(id: CodexWindow['id']) {
    const selectedWindow = windows.find(window => window.id === id);
    if (selectedWindow == null) return;
    selectedWindow.state = 'closed';
  }

  function focusWindow(id: CodexWindow['id']): void {
    const index = windows.findIndex(codexWindow => codexWindow.id === id);
    if (index < 0) return;
    windows.push(windows.splice(index, 1)[0]);
    windows.forEach((window, currentIndex) => {
      window.position.z = currentIndex
      return window;
    });
  }

  return {
    get windows() { return windows; },
    openWindow,
    focusWindow,
    closeWindow,
    addWindows,
    setLoginEnabled,
  }
}

export const WINDOW_SERVICE = createWindowService();
