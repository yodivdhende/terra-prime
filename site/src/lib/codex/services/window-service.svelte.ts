import { v4 as uuidv4 } from 'uuid';

function createWindowService() {
  const windows = $state([
    {
      id: uuidv4(),
      type: 'pdf',
      state: 'open',
      dimension: { w: 300, h: 300 },
      position: { x: 100, y: 100, z: 0 },
      contentData: 'content',
      title: 'irene.pdf',
      icon: { type: 'file' }
    }
  ] as CodexWindow[]);

  function addWindows(items: { name: string, mimeType: string, id: string }[]): void {
    const newWindows = items.filter(item => windows.every(window => window.id != item.id))
      .forEach((item) => {
        const windowIndex = windows.findIndex(window => window.id === item.id);
        if (windowIndex >= 0) return

        if (item.mimeType.includes('folder')) {
          windows.push(
            createFolderWindow(item.name, windows.length, item.id)
          )
          return;
        }
        if (item.mimeType.includes('pdf')) {
          windows.push(
            createPdfWindow(item.name, windows.length, item.id)
          )
          return;
        }
      })

    console.log('windows', $state.snapshot(windows));
  }

  function openWindow({ id }: { id: CodexWindow['id'] }
  ) {
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

  function createFolderWindow(name: string, index: number, id: string): CodexWindow {
    return {
      id,
      type: 'dir',
      state: 'closed',
      dimension: { w: 300, h: 300 },
      position: { x: 100 * index, y: 100 * index, z: index },
      contentData: id,
      title: name,
      icon: { type: 'dir' },
    }
  }

  function createPdfWindow(name: string, index: number, id: string): CodexWindow {
    return {
      id,
      type: 'pdf',
      state: 'closed',
      dimension: { w: 300, h: 300 },
      position: { x: 100 * index, y: 100 * index, z: index },
      contentData: id,
      title: name,
      icon: { type: 'file' },
    }
  }

  return {
    windows,
    openWindow,
    focusWindow,
    closeWindow,
    addWindows,
  }
}

export const WINDOW_SERVICE = createWindowService();


export type CodexWindow = {
  id: string;
  type: 'pdf' | 'dir';
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  contentData: string;
  title: string;
  icon?: Icon;
}

export type Icon = {
  type: 'file' | 'dir'
}
