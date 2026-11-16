import { AgentConfig, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type bunyan from 'bunyan'
import AvailableComponent from '../../types/AvailableComponent'
import config from '../../config'
import Component from '../../types/Component'
import TimeoutOptions from '../../types/TimeoutOptions'

export type ComponentsApiResponse<T extends AvailableComponent[]> = Record<T[number], Component>

export type GetComponentsArg = {
  userToken: string
  timeoutOptions: TimeoutOptions
  log: bunyan | typeof console
  classes?: string
}

function generateQueryParams(param: GetComponentsArg): string {
  return param.classes
    ? `component=header&component=footer&classes=${param.classes}`
    : 'component=header&component=footer'
}

class ComponentApiClient extends RestClient {
  constructor(logger: bunyan | typeof console, timeout: TimeoutOptions) {
    super(
      'HMPPS Probation Frontend Components API',
      {
        url: config.apis.feComponents.url,
        timeout,
        agent: new AgentConfig(timeout.response),
      },
      logger,
    )
  }

  getComponents<T extends AvailableComponent[]>(param: GetComponentsArg): Promise<ComponentsApiResponse<T>> {
    return this.get<ComponentsApiResponse<T>>({
      path: '/api/components',
      query: generateQueryParams(param),
      headers: { 'x-user-token': param.userToken },
      retries: 1,
      timeout: param.timeoutOptions,
      retryHandler: () => (err, _res) => {
        if (err) {
          const { code, message } = err as Error & { code?: string }
          param.log.info(`Retry handler found API error with ${code} ${message}`)
        }
        // Return undefined so SuperAgent keeps its default retry decisions
        return undefined
      },
    })
  }
}

export default {
  async getComponents<T extends AvailableComponent[]>(param: GetComponentsArg): Promise<ComponentsApiResponse<T>> {
    return new ComponentApiClient(param.log, param.timeoutOptions).getComponents(param)
  },
}
