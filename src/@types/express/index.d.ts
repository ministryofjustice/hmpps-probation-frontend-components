import { HmppsUser } from '../../types/HmppsUser'

export declare global {
  namespace Express {
    interface FeComponents {
      header: string
      footer: string
      cssIncludes: string[]
      jsIncludes: string[]
    }

    interface Locals {
      user: HmppsUser
      feComponents: FeComponents
    }
  }
}
