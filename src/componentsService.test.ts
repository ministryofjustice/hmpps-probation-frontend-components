import nock from 'nock'
import * as cheerio from 'cheerio'
import { Request, Response, NextFunction } from 'express'
import nunjucks from 'nunjucks'
import getFrontendComponents from './componentsService'
import config from './config'
import { HmppsUser, ProbationUser } from './types/HmppsUser'
import ComponentApiClientModule from './data/componentApi/componentApiClient'

const probationUser = { token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' } as ProbationUser
const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
}

let componentsApi: nock.Scope

beforeEach(() => {
  componentsApi = nock(config.apis.feComponents.url)
})

afterEach(() => {
  jest.resetAllMocks()
})

nunjucks.configure(
  ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
  { autoescape: true },
)

describe('getFrontendComponents', () => {
  it('request the compnents content from the API clients', async () => {
    // Given
    const middleware = getFrontendComponents({ pdsUrl: '' })
    const req = {} as Request
    const res = {
      locals: {
        user: { token: 'hgjgjhgjhg' },
      },
    } as any as Response
    jest.spyOn(ComponentApiClientModule, 'getComponents').mockResolvedValue({})

    // When
    await middleware(req, res, jest.fn() as NextFunction)

    // Then
  })
})
