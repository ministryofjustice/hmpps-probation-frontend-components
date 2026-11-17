/**
 * Minimal logger surface used by this package.
 * Compatible with bunyan, console, and test doubles.
 */
export default interface Logger {
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}
