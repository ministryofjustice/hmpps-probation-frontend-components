import type Logger from '../../src/types/Logger'

export type FakeLogger = {
  info: jest.MockedFunction<Logger['info']>
  error: jest.MockedFunction<Logger['error']>
  warn: jest.MockedFunction<Logger['warn']>
  debug: jest.MockedFunction<Logger['debug']>
}

export function fakeLogger(): FakeLogger {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}
