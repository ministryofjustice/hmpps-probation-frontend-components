import bunyan from 'bunyan'

export type FakeLogger = {
  info: jest.Mock
  error: jest.Mock
  warn: jest.Mock
  debug: jest.Mock
}

export function fakeLogger(): FakeLogger & bunyan {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as FakeLogger & bunyan
}
