export type CodexWindow = {
  id: string;
  type: 'pdf' | 'dir' | 'doc' | 'image' | 'settings' | 'playtest' | 'login' | 'register' | 'logout';
  state: 'open' | 'hidden' | 'closed';
  dimension: { w: number, h: number };
  position: { x: number, y: number, z: number };
  contentData: string;
  title: string;
  icon?: Icon;
}

export type Icon = {
  type: 'file' | 'dir' | 'image' | 'settings' | 'playtest' | 'login' | 'register' | 'logout';
  side: 'left' | 'right';
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
    icon: { type: 'settings', side: 'left' },
  };
}

export function createFolderWindow({ name, index, id, side }: { name: string, index: number, id: string, side: 'left' | 'right' }): CodexWindow {
  return {
    id,
    type: 'dir',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.55), h: Math.round(window.innerHeight * 0.6) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'dir', side },
  }
}

export function createPdfWindow({ name, index, id, side }: { name: string, index: number, id: string, side: 'left' | 'right' }): CodexWindow {
  return {
    id,
    type: 'pdf',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.4), h: Math.round(window.innerHeight * 0.75) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'file', side },
  }
}

export function createDocWindow({ name, index, id, side }: { name: string, index: number, id: string, side: 'left' | 'right' }): CodexWindow {
  return {
    id,
    type: 'doc',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.45), h: Math.round(window.innerHeight * 0.65) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'file', side },
  }
}

export function createImageWindow({ name, index, id, side }: { name: string, index: number, id: string, side: 'left' | 'right' }): CodexWindow {
  return {
    id,
    type: 'image',
    state: getState(name),
    dimension: { w: Math.round(window.innerWidth * 0.35), h: Math.round(window.innerHeight * 0.55) },
    position: { x: 400 + 20 * index, y: 20 * index, z: index },
    contentData: id,
    title: formatName(name),
    icon: { type: 'image', side },
  }
}

export function createLoginWindow({ shouldCreate }: { shouldCreate: boolean }): CodexWindow | null {
  if (shouldCreate === false) return null
  return {
    id: 'login',
    type: 'login',
    state: 'closed',
    dimension: { w: 320, h: 400 },
    position: { x: 300, y: 100, z: 0 },
    contentData: 'login',
    title: 'login',
    icon: { type: 'login', side: 'left' },
  };
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
    icon: { type: 'playtest', side: 'left' },
  };
}

export function createLogoutWindow({ shouldCreate }: { shouldCreate: boolean }): CodexWindow | null {
  if (!shouldCreate) return null;
  return {
    id: 'logout',
    type: 'logout',
    state: 'closed',
    dimension: { w: 280, h: 160 },
    position: { x: 300, y: 100, z: 0 },
    contentData: 'logout',
    title: 'account',
  };
}

export function createRegisterWindow({ shouldCreate }: { shouldCreate: boolean }): CodexWindow | null {
  if (shouldCreate === false) return null;
  return {
    id: 'register',
    type: 'register',
    state: 'closed',
    dimension: { w: Math.round(window.innerWidth * 0.8), h: Math.round(window.innerHeight * 0.8) },
    position: { x: 100, y: 50, z: 0 },
    contentData: 'register',
    title: 'event registration',
    icon: { type: 'register', side: 'left' },
  };
}

function getState(name: string): 'open' | 'closed' {
  return name[0] === '!' ? 'open' : 'closed';
}

function formatName(name: string): string {
  if (name[0] === '!') return name.substring(1);
  return name;
}
