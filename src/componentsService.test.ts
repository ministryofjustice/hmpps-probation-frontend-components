import express from 'express'
import nunjucks from 'nunjucks'
import request from 'supertest'
import nock from 'nock'
import * as cheerio from 'cheerio'
import getFrontendComponents from './componentsService'
import config from './config'
import { HmppsUser, ProbationUser } from './types/HmppsUser'

const probationUser = { token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' } as ProbationUser
const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
}

function setupApp(
  {
    user,
    useFallbacksByDefault,
  }: {
    user?: HmppsUser
    useFallbacksByDefault?: boolean
  } = { user: probationUser, useFallbacksByDefault: false },
): express.Application {
  const app = express()
  app.use((req, res, next) => {
    res.locals.user = user
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
    }),
  )

  app.get('/', (_req, res) => res.send({ feComponents: res.locals.feComponents }))

  return app
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

    return request(setupApp())
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
  })

  describe('fallbacks', () => {
    describe('when probation user', () => {
      it('should provide a fallback header', async () => {
        componentsApi
          .get('/api/components?component=header&component=footer')
          .reply(500)
          .get('/api/components?component=header&component=footer')
          .reply(500)

        return request(setupApp())
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
          })
      })

      it('should provide a fallback footer', async () => {
        componentsApi
          .get('/api/components?component=header&component=footer')
          .reply(500)
          .get('/api/components?component=header&component=footer')
          .reply(500)

        return request(setupApp())
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
          })
      })
    })

    describe('when no user', () => {
      it('should provide a fallback header', async () => {
        return request(setupApp({ user: undefined }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)

            expect($header('[data-qa="header-user-name"]').length).toEqual(0)
            expect($header('a[href="http://pdsUrl"]').text()).toContain('Probation Digital Services')
            expect($header('a[href="/sign-out"]').length).toEqual(0)

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })

      it('should provide a fallback footer', async () => {
        return request(setupApp({ user: undefined }))
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
          })
      })
    })

    describe('when configured to only use fallbacks', () => {
      it('should provide a fallback header', async () => {
        componentsApi.get('/api/components?component=header&component=footer').reply(200, apiResponse)

        return request(setupApp({ user: probationUser, useFallbacksByDefault: true }))
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
          })
      })

      it('should provide a fallback footer', async () => {
        componentsApi.get('/api/components?component=header&component=footer').reply(200, apiResponse)

        return request(setupApp({ user: probationUser, useFallbacksByDefault: true }))
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
          })
      })
    })
  })
})

const normaliseHtml = html =>
  html
    .replace(/>\s+</g, '><') // remove inter-tag whitespace
    .trim()
