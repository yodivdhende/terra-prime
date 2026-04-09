import { v4 as uuidv4 } from 'uuid';

function createWindowService() {
  let windows = $state([
    {
      id: uuidv4(),
      state: 'open',
      dimension: { w: 300, h: 300 },
      position: { x: 300, y: 300 },
      content: 'content',
      title: 'title'
    }
  ] as CodexWindow[]);
  const openWindows = $derived(windows.filter(window => window.state === 'open'));


  function openWindow({ id, content }:
    { id?: CodexWindow['id'], content: CodexWindow['content'] }
    | { id: CodexWindow['id'], content?: CodexWindow['content'] }
  ) {
    if (content != null) createNewWindow(content);
    if (id != null) updateStateToOpen(id);
  }

  function updateStateToOpen(id: CodexWindow['id']): void {
    windows = windows.map(window => {
      if (window.id === id) window.state = 'open';
      return window
    })
  }

  function createNewWindow(content: CodexWindow['content']) {
    windows = [...windows, {
      id: uuidv4(),
      state: 'open',
      dimension: { w: 300, h: 300 },
      position: { x: 100, y: 100, z: windows.length },
      content,

    } as CodexWindow]
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
    windows = windows.map((window, currentIndex) => {
      window.position.z = currentIndex
      return window;
    });
  }

  return {
    openWindows,
    openWindow,
    focusWindow,
    closeWindow,

  }
}

export const WINDOW_SERVICE = createWindowService();


export type CodexWindow = {
  id: string;
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  content: string;
  title: string;
}
