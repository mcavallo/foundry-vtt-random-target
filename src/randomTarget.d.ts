import type { ModuleWindow } from '#/types/module.ts';

declare global {
  interface Window {
    randomTarget: ModuleWindow;
  }
}

export {};
