import Logger from './Logger'
import TimeoutOptions from './TimeoutOptions'

export default interface RequestOptions {
  pdsUrl: string
  environmentName?: 'DEV' | 'PRE-PRODUCTION' | 'PRODUCTION'
  logger?: Logger
  useFallbacksByDefault?: boolean
  timeoutOptions?: TimeoutOptions
  classes?: string
}
