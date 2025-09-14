import type { ModuleWindow, TranslationKeys } from '#/types/module.ts';
import { MODULE } from '@/constants.ts';
import defaultTranslationsFile from '@/lang/en.json';

const defaultTranslations = defaultTranslationsFile['random-target'];

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

export function isTokenDefeated(token: TokenDocument): boolean {
  return token?.actor?.statuses.has('dead') ?? false;
}

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

export function getIsAnimatedImage(src: string): boolean {
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

/**
 * Calls the game.i18n.localize or returns the key if the invocation happens before
 * the localization system was initialized.
 */
export const safeLocalize = (key: string) => {
  return game?.i18n ? game.i18n.localize(key) : key;
};

/**
 * Replaces data tokens in a localized string, based in the implementation of the core
 * game.i18n.format function.
 */
export const formatLocalizedString = (
  value: string,
  data?: Record<string, string | number>
) => {
  if (typeof data === 'undefined') {
    return value;
  }

  return value.replace(/{[^}]+}/g, (token) => {
    return String(data[token.slice(1, -1)]);
  });
};

/**
 * Prefixes a module translation key with the module id.
 */
export const prefixLocalizationKey = (key: string) => {
  return foundry.utils.hasProperty(defaultTranslations, key)
    ? `${MODULE.ID}.${key}`
    : key;
};

/**
 * Localizes a key. If the key is missing in the current language it attempts to use
 * the default translation fallback.
 */
export const localizeStringOrUseFallback = (key: string) => {
  const translation = safeLocalize(key);

  if (translation !== key) {
    return translation;
  }

  const fallback = foundry.utils.getProperty(defaultTranslations, key);

  if (fallback) {
    console.warn(`Using fallback for translation '${key}'.`);
    return fallback;
  }

  console.warn(`Missing translation '${key}'.`);
  return key;
};

/**
 * Prefixes a module translation key and attempts to translate it. It uses the default
 * translations as fallback.
 */
export const t = (
  key: TranslationKeys,
  data?: Record<string, string | number>
): string => {
  // Avoid early calls and emit a console warning for visibility
  if (!game?.i18n) {
    console.warn(`Missing early call translation '${key}'.`);
    return key;
  }

  const prefixedKey = prefixLocalizationKey(key);
  const translation = localizeStringOrUseFallback(prefixedKey);
  return formatLocalizedString(translation, data);
};
