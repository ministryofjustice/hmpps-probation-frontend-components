import superagent from 'superagent'
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

function generateQueryParams(param: GetComponentsArg): string | Record<string, any> {
  return param.classes
    ? `component=header&component=footer&classes=${param.classes}`
    : 'component=header&component=footer'
}

export default {
  async getComponents<T extends AvailableComponent[]>(param: GetComponentsArg): Promise<ComponentsApiResponse<T>> {
    const result = await superagent
      .get(`${config.apis.feComponents.url}/api/components`)
      .retry(1, (err, _res) => {
        if (err) param.log.info(`Retry handler found API error with ${err.code} ${err.message}`)
        return undefined // retry handler only for logging retries, not to influence retry logic
      })
      .query(generateQueryParams(param))
      .set({ 'x-user-token': param.userToken })
      .timeout(param.timeoutOptions)

    return result.body
  },
}
