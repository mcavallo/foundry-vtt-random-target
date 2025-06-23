import type { ModuleWindow } from '#/types/module.ts';

export const $M = (): ModuleWindow => {
  return window.randomTarget;
};

export const isInputEvent = (
  e: Event
): e is Event & { target: HTMLInputElement } => {
  return e instanceof Event && e.target instanceof HTMLInputElement;
};

export const isElementEvent = (e: Event): e is Event & { target: HTMLElement } => {
  return e instanceof Event && e.target instanceof HTMLElement;
};

export const isValidFormSubmit = (e: Event | SubmitEvent) => {
  if (!(e instanceof SubmitEvent && e.submitter instanceof HTMLButtonElement)) {
    return false;
  }

  return e.submitter?.name === 'submit';
};

export const isEventTarget = <T extends EventTarget>(
  event: Event,
  type: new () => T
): event is Event & { target: T } => {
  return event.target instanceof type;
};

export function isTokenDefeated(token: TokenDocument): Boolean {
  return token?.actor?.statuses.has('dead') ?? false;
}

export const sortBy =
  <T, C>(picker: (arg: T) => C) =>
  (a: T, b: T): number => {
    const aV = picker(a);
    const bV = picker(b);
    if (aV < bV) {
      return -1;
    }

    if (aV > bV) {
      return 1;
    }

    return 0;
  };

export function sortNaturally(a: string | number, b: string | number) {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

export function sortByName(a: { name: string }, b: { name: string }) {
  return sortNaturally(a.name, b.name);
}

export function getDispositionName(value: CONST.TOKEN_DISPOSITIONS) {
  const keys = Object.keys(
    CONST.TOKEN_DISPOSITIONS
  ) as (keyof typeof CONST.TOKEN_DISPOSITIONS)[];

  for (const k of keys) {
    if (value === CONST.TOKEN_DISPOSITIONS[k]) {
      return k.toLowerCase();
    }
  }

  return;
}

export function getIsAnimatedImage(src: string): Boolean {
  return !!src && !!src.toLowerCase().match(/(?:mp4|ogv|webm)$/);
}

export const stripSettingNamespace = <T extends string | string[]>(name: T): T => {
  if (typeof name === 'string') {
    const [, ...rest] = name.split('.');
    return rest.join('.') as T;
  }

  return name;
};

export function formatTabId(id: string): string {
  return id.replace(/[^a-z0-9]/gi, '_');
}

export function formatActorTypeId(raw?: string): string | undefined {
  if (!raw) {
    return;
  }

  const normalizedKey = raw.toLowerCase();
  return `type.${normalizedKey}`;
}

export function formatCategoryLabel(str: string): string {
  const lower = str.toLowerCase();

  return ['npc', 'pc'].includes(lower)
    ? lower.toUpperCase()
    : lower.replace(/\b\w/g, (s) => s.toUpperCase());
}

export function formatDispositionId(
  value: CONST.TOKEN_DISPOSITIONS
): string | undefined {
  const disposition = getDispositionName(value);
  return disposition ? `disposition.${disposition}` : undefined;
}

export const quotesToEntities = (str: string) => str.replace(/"/g, '&quot;');
