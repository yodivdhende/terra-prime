export type CodexWindow = {
  id: string;
  type: 'pdf' | 'dir' | 'doc' | 'image' | 'settings' | 'playtest';
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  contentData: string;
  title: string;
  icon?: Icon;
}

export type Icon = {
  type: 'file' | 'dir' | 'image' | 'settings' | 'playtest'
}

export function createSettingsWindow(): CodexWindow {
  return {
    id: 'settings',
    type: 'settings',
    state: 'closed',
    dimension: { w: 400, h: 300 },
    position: { x: 400, y: 50, z: 0 },
    contentData: 'settings',
    title: 'settings',
    icon: { type: 'settings' },
  };
}

export function createFolderWindow(name: string, index: number, id: string): CodexWindow {
  return {
    id,
    type: 'dir',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.55), h: Math.round(window.innerHeight * 0.6) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'dir' },
  }
}

export function createPdfWindow(name: string, index: number, id: string): CodexWindow {
  return {
    id,
    type: 'pdf',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.4), h: Math.round(window.innerHeight * 0.75) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'file' },
  }
}

export function createDocWindow(name: string, index: number, id: string): CodexWindow {
  return {
    id,
    type: 'doc',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.45), h: Math.round(window.innerHeight * 0.65) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'file' },
  }
}

export function createImageWindow(name: string, index: number, id: string): CodexWindow {
  return {
    id,
    type: 'image',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.35), h: Math.round(window.innerHeight * 0.55) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'image' },
  }
}

export function createPlaytestWindow(): CodexWindow {
  return {
    id: 'playtest',
    type: 'playtest',
    state: 'closed',
    dimension: { w: 480, h: 520 },
    position: { x: 200, y: 80, z: 0 },
    contentData: 'playtest',
    title: 'playtest registratie',
    icon: { type: 'playtest' },
  };
}

function getState(name: string): 'open' | 'closed' {
  return name[0] === '!' ? 'open' : 'closed';
}

function formatName(name: string): string {
  if (name[0] === '!') return name.substring(1);
  return name;
}
