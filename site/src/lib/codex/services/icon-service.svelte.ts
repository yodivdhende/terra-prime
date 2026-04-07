import { v4 as uuidv4 } from 'uuid';
import { Component } from "svelte";
import { CodexWindow } from "./window-service.svelte";
import { File } from '@lucide/svelte';

function createIconService() {
  const icons = $state([
    { id: uuidv4(), icon: File, name: 'test', windowContent: 'Test' },
  ] as Icon[]);

  return {
    icons,
  }
}

export const ICON_SERVICE = createIconService();

export type Icon = {
  id: string;
  icon: Component,
  name: string;
  windowContent: CodexWindow['content'],
}

