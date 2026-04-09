import { v4 as uuidv4 } from 'uuid';

function createWindowService() {
  const windows = $state([
    // {
    //   id: uuidv4(),
    //   state: 'open',
    //   dimension: { w: 300, h: 300 },
    //   position: { x: 300, y: 300, z: 0 },
    //   content: 'content',
    //   title: 'title'
    // }
  ] as CodexWindow[]);

  function openWindow({ id, content }:
    { id?: CodexWindow['id'], content: CodexWindow['content'] }
  ) {
    console.log(id, content);
    if (id != null) return updateStateToOpen(id);
    return createNewWindow(content);
  }

  function updateStateToOpen(id: CodexWindow['id']): void {
    const selectedWindow = windows.find(window => window.id === id);
    if (selectedWindow == null) return;
    selectedWindow.state = 'open';
    return id;
  }

  function createNewWindow(content: CodexWindow['content']) {
    const id = uuidv4();
    windows.push({
      id,
      state: 'open',
      dimension: { w: 300, h: 300 },
      position: { x: 100, y: 100, z: windows.length },
      content,

    } as CodexWindow);
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
    windows,
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
