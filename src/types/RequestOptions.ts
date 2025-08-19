import type bunyan from 'bunyan'
import TimeoutOptions from './TimeoutOptions'

export default interface RequestOptions {
  pdsUrl: string
  environmentName?: 'DEV' | 'PRE-PRODUCTION' | 'PRODUCTION'
  logger?: bunyan | typeof console
  useFallbacksByDefault?: boolean
  timeoutOptions?: TimeoutOptions
}
