function createWindowService() {
  const windows = $state([] as CodexWindow[]);

  function addWindows(items: { name: string, mimeType: string, id: string }[]): void {
    items.filter(item => windows.every(window => window.id != item.id))
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
        if (item.mimeType.includes('document')) {
          windows.push(
            createDocWindow(item.name, windows.length, item.id)
          )
          return;
        }
        if (item.mimeType.includes('image')) {
          windows.push(
            createImageWindow(item.name, windows.length, item.id)
          )
          return;
        }
      })
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
      dimension: { w: Math.round(window.innerWidth * 0.55), h: Math.round(window.innerHeight * 0.6) },
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
      dimension: { w: Math.round(window.innerWidth * 0.4), h: Math.round(window.innerHeight * 0.75) },
      position: { x: 100 * index, y: 100 * index, z: index },
      contentData: id,
      title: name,
      icon: { type: 'file' },
    }
  }

  function createDocWindow(name: string, index: number, id: string): CodexWindow {
    return {
      id,
      type: 'doc',
      state: 'open',
      dimension: { w: Math.round(window.innerWidth * 0.45), h: Math.round(window.innerHeight * 0.65) },
      position: { x: 100 * index, y: 100 * index, z: index },
      contentData: id,
      title: name,
      icon: { type: 'file' },
    }
  }

  function createImageWindow(name: string, index: number, id: string): CodexWindow {
    return {
      id,
      type: 'image',
      state: 'closed',
      dimension: { w: Math.round(window.innerWidth * 0.35), h: Math.round(window.innerHeight * 0.55) },
      position: { x: 100 * index, y: 100 * index, z: index },
      contentData: id,
      title: name,
      icon: { type: 'image' },
    }
  }

  return {
    get windows() { return windows; },
    openWindow,
    focusWindow,
    closeWindow,
    addWindows,
  }
}

export const WINDOW_SERVICE = createWindowService();


export type CodexWindow = {
  id: string;
  type: 'pdf' | 'dir' | 'doc' | 'image';
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  contentData: string;
  title: string;
  icon?: Icon;
}

export type Icon = {
  type: 'file' | 'dir' | 'image'
}
