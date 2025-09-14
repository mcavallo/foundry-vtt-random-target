import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import type { TranslationKeys } from '#/types/module.ts';
import {
  formatLocalizedString,
  localizeStringOrUseFallback,
  prefixLocalizationKey,
  safeLocalize,
  t,
} from '@/lib/utils';

const originalFoundry = globalThis.foundry;
const originalGame = globalThis.game;

const getPropertyMock = jest.fn();
const hasPropertyMock = jest.fn();
const i18nMock = jest.fn();
const consoleWarnMock = jest.fn();

const localizeStub = (input: string) => `localized:${input}`;

beforeEach(() => {
  globalThis.foundry = {
    utils: {
      getProperty: getPropertyMock,
      hasProperty: hasPropertyMock,
    },
  };
  globalThis.game = {} as Game;

  Object.defineProperty(globalThis.game, 'i18n', {
    get: i18nMock,
    configurable: true,
  });
  i18nMock.mockReturnValue(undefined);

  console.warn = consoleWarnMock;
});

afterEach(() => {
  globalThis.game = originalGame;
  globalThis.foundry = originalFoundry;

  getPropertyMock.mockClear();
  hasPropertyMock.mockClear();
  i18nMock.mockClear();
  consoleWarnMock.mockClear();
});

describe(`safeLocalize`, () => {
  it(`returns the localized value`, () => {
    i18nMock.mockReturnValue({ localize: localizeStub });

    expect(safeLocalize('foo')).toEqual('localized:foo');
  });

  it(`returns the key unchanged when game.i18n is not present`, () => {
    expect(safeLocalize('foo')).toEqual('foo');
  });
});

describe(`formatLocalizedString`, () => {
  it(`replaces tokens in the value`, () => {
    expect(formatLocalizedString('hello {name}', { name: 'world' })).toEqual(
      'hello world'
    );
  });

  it(`ignores unused tokens`, () => {
    expect(
      formatLocalizedString('hello {name}', { name: 'world', count: 3 })
    ).toEqual('hello world');
  });

  it(`returns the value unchanged if no data is passed`, () => {
    expect(formatLocalizedString('foo')).toEqual('foo');
  });
});

describe(`prefixLocalizationKey`, () => {
  it(`uses a prefix when the key is part of the module keys`, () => {
    hasPropertyMock.mockImplementation(() => true);

    expect(prefixLocalizationKey('foo')).toEqual('random-target.foo');
  });

  it(`returns the key unchanged otherwise`, () => {
    hasPropertyMock.mockImplementation(() => false);

    expect(prefixLocalizationKey('foo')).toEqual('foo');
  });
});

describe(`localizeStringOrUseFallback`, () => {
  it(`returns the translated string`, () => {
    i18nMock.mockReturnValue({ localize: localizeStub });

    expect(localizeStringOrUseFallback('foo')).toEqual('localized:foo');
  });

  it(`returns the fallback translation and emits a warning when the key could not be localized`, () => {
    getPropertyMock.mockImplementation((_, key: string) => `fallback:${key}`);

    expect(localizeStringOrUseFallback('foo')).toEqual('fallback:foo');
    expect(consoleWarnMock).toHaveBeenCalledWith(
      `Using fallback for translation 'foo'.`
    );
  });

  it(`returns the key and emits a warning when no fallback was found`, () => {
    getPropertyMock.mockImplementation(() => undefined);

    expect(localizeStringOrUseFallback('foo')).toEqual('foo');
    expect(consoleWarnMock).toHaveBeenCalledWith(`Missing translation 'foo'.`);
  });
});

describe(`t`, () => {
  it(`returns a translated string`, () => {
    i18nMock.mockReturnValue({ localize: localizeStub });
    hasPropertyMock.mockImplementation(() => true);

    const key = 'foo' as TranslationKeys;
    expect(t(key)).toEqual(`localized:random-target.${key}`);
  });

  it(`returns a translated string with data tokens`, () => {
    i18nMock.mockReturnValue({ localize: localizeStub });
    hasPropertyMock.mockImplementation(() => true);

    const key = 'hello {name}' as TranslationKeys;
    expect(t(key, { name: 'world' })).toEqual(`localized:random-target.hello world`);
  });

  it(`returns the key and emits a warning when called before i18n is initialized`, () => {
    const key = 'foo' as TranslationKeys;
    expect(t(key)).toEqual(key);
    expect(consoleWarnMock).toHaveBeenCalledWith(
      `Missing early call translation 'foo'.`
    );
  });
});
