import { format } from 'node:util';
import { piped } from 'remeda';
import type { CtxAndValue } from '#/scripts/lib/neverthrow.ts';

const makeMessage = (msg: MessageWithFormat) => {
  return typeof msg === 'string' ? msg : format(...msg);
};

export const logger = {
  info: piped(makeMessage, console.log),
  error: piped(makeMessage, console.error),
};

export type Logger = typeof logger;
export type MessageWithFormat = string | [string, ...unknown[]];

/**
 * Lazily logs a trace using the context logger
 */
export const logOk =
  (msg: MessageWithFormat) =>
  <C extends { logger: Logger }>({ ctx }: CtxAndValue<C>): void => {
    ctx.logger.info(msg);
  };
