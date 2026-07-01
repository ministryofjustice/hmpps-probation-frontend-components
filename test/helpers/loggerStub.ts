import bunyan from 'bunyan'

export function fakeLogger() {
  return { error: jest.fn() } as any as bunyan
}
