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
      title: 'irene.pdf'
    }
  ] as CodexWindow[]);

  function openWindow({ id, content, title }:
    { id?: CodexWindow['id'], content: CodexWindow['contentData'], title: CodexWindow['title'] }
  ) {
    console.log(id, content, title);
    if (id != null) return updateStateToOpen(id);
    return createNewWindow({ content, title });
  }

  function updateStateToOpen(id: CodexWindow['id']): string {
    const selectedWindow = windows.find(window => window.id === id);
    if (selectedWindow == null) return id;
    selectedWindow.state = 'open';
    return id;
  }

  function createNewWindow({ content, title }:
    { content: CodexWindow['contentData'], title: CodexWindow['title'] }
  ) {
    const id = uuidv4();
    windows.push({
      id,
      state: 'open',
      dimension: { w: 300, h: 300 },
      position: { x: 100, y: 100, z: windows.length },
      contentData: content,
      title,
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
  type: 'pdf';
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  contentData: string;
  title: string;
}
