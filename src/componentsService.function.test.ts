import express from 'express'
import nunjucks from 'nunjucks'
import request from 'supertest'
import nock from 'nock'
import * as cheerio from 'cheerio'
import getFrontendComponents from './componentsService'
import config from './config'
import { HmppsUser, ProbationUser } from './types/HmppsUser'
import { fakeLogger, FakeLogger } from '../test/helpers/loggerStub'

const probationUser = { token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' } as ProbationUser
const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
}

function setupApp(
  options: {
    user?: HmppsUser | null
    useFallbacksByDefault?: boolean
    logger?: FakeLogger
  } = {},
): { app: express.Application; logger: FakeLogger } {
  const { user = probationUser, useFallbacksByDefault = false, logger = fakeLogger() } = options
  const app = express()
  app.use((_req, res, next) => {
    res.locals.user = user ?? undefined
    next()
  })

  app.set('view engine', 'njk')
  nunjucks.configure(
    ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
    { autoescape: true, express: app },
  )

  app.use(
    getFrontendComponents({
      pdsUrl: 'http://pdsUrl',
      useFallbacksByDefault,
      logger,
    }),
  )

  app.get('/', (_req, res) => res.send({ feComponents: res.locals.feComponents }))

  return { app, logger }
}

let componentsApi: nock.Scope

beforeEach(() => {
  componentsApi = nock(config.apis.feComponents.url)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getFrontendComponents', () => {
  it('should call fe components api and attach header and footer html with all css and js combined', async () => {
    componentsApi.get('/api/components?component=header&component=footer').reply(200, apiResponse)
    const { app, logger } = setupApp()

    return request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200, {
        feComponents: {
          header: 'header',
          footer: 'footer',
          cssIncludes: ['header.css', 'footer.css'],
          jsIncludes: ['header.js', 'footer.js'],
        },
      })
      .expect(() => {
        expect(logger.error).not.toHaveBeenCalled()
        expect(logger.info).not.toHaveBeenCalled()
      })
  })

  describe('fallbacks', () => {
    describe('when probation user', () => {
      it('should provide a fallback header', async () => {
        componentsApi.get('/api/components?component=header&component=footer').reply(500)
        const { app, logger } = setupApp()

        return request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)

            expect($header('[data-qa="header-user-name"]').text()).toContain('E. Shannon')
            expect($header('a[href="http://pdsUrl"]').text()).toContain('Probation Digital Services')
            expect($header('a[href="/sign-out"]').text()).toContain('Sign out')

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
            expect(logger.error).toHaveBeenCalledWith(
              expect.anything(),
              'Failed to retrieve front end components, using fallbacks',
            )
          })
      })

      it('should provide a fallback footer', async () => {
        componentsApi.get('/api/components?component=header&component=footer').reply(500)
        const { app, logger } = setupApp()

        return request(app)
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(normaliseHtml(res.body.feComponents.footer)).toEqual(
              normaliseHtml(
                '<footer class="probation-common-fallback-footer govuk-!-display-none-print" role="contentinfo">' +
                  '<div class="govuk-width-container">' +
                  '<div class="govuk-grid-row">' +
                  '<div class="govuk-grid-column-full">' +
                  '</div>' +
                  '</div>' +
                  '</div>' +
                  '</footer>',
              ),
            )

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
            expect(logger.error).toHaveBeenCalledWith(
              expect.anything(),
              'Failed to retrieve front end components, using fallbacks',
            )
          })
      })
    })

    describe('when no user in context', () => {
      it('should log that fallbacks are used because there is no user', async () => {
        const { app, logger } = setupApp({ user: null })

        return request(app)
          .get('/')
          .expect(200)
          .expect(() => {
            expect(logger.info).toHaveBeenCalledWith('Using fallback frontend components when no user in context')
            expect(logger.error).not.toHaveBeenCalled()
          })
      })
    })

    describe('when useFallbacksByDefault is true', () => {
      it('should log that fallbacks are used by default', async () => {
        const { app, logger } = setupApp({ useFallbacksByDefault: true })

        return request(app)
          .get('/')
          .expect(200)
          .expect(() => {
            expect(logger.info).toHaveBeenCalledWith('Using fallback frontend components by default')
            expect(logger.error).not.toHaveBeenCalled()
          })
      })
    })
  })
})

const normaliseHtml = (html: string) =>
  html
    .replace(/>\s+</g, '><') // remove inter-tag whitespace
    .trim()
