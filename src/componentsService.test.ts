import { Request, Response, NextFunction } from 'express'
import nunjucks from 'nunjucks'
import { describe } from 'node:test'
import getFrontendComponents from './componentsService'
import * as UpdateCspModule from './utils/updateCsp'
import ComponentApiClientModule from './data/componentApi/componentApiClient'
import { fakeLogger } from '../test/helpers/loggerStub'

const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
}

nunjucks.configure(
  ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
  { autoescape: true },
)

describe('getFrontendComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks() // Clear call histories between tests
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => {
    jest.clearAllMocks() // Clear call histories between tests
  })

  function stubGetComponent(response: any) {
    jest.spyOn(ComponentApiClientModule, 'getComponents').mockResolvedValue(response)
  }

  function createResponseObject(token: string) {
    return {
      locals: {
        user: { token },
      },
    } as any as Response
  }

  function createResponseObjectWithNoUser() {
    return {
      locals: {},
    } as any as Response
  }

  const stubUpdateCsp = () => jest.spyOn(UpdateCspModule, 'default').mockImplementation(jest.fn())

  describe('when API client successfully fetches the content', () => {
    it('request the components content from the API clients', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '' })
      stubUpdateCsp()
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      stubGetComponent(apiResponse)

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(ComponentApiClientModule.getComponents).toHaveBeenCalledWith({
        userToken: 'phUw9cruyosubane',
        timeoutOptions: { response: 2500, deadline: 2500 },
        log: console,
      })
    })

    it('request the components content with the added classes when provided', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', classes: 'my-classes' })
      stubUpdateCsp()
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      stubGetComponent(apiResponse)

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(ComponentApiClientModule.getComponents).toHaveBeenCalledWith({
        userToken: 'phUw9cruyosubane',
        timeoutOptions: { response: 2500, deadline: 2500 },
        log: console,
        classes: 'my-classes',
      })
    })

    it('sets the header component content from the API response in the response object', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', classes: 'my-classes' })
      stubUpdateCsp()
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      stubGetComponent(apiResponse)

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.header).toEqual('header')
      expect(res.locals.feComponents.cssIncludes[0]).toEqual('header.css')
      expect(res.locals.feComponents.jsIncludes[0]).toEqual('header.js')
    })

    it('sets the footer component content from the API response in the response object', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '' })
      stubUpdateCsp()
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      stubGetComponent(apiResponse)

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.footer).toEqual('footer')
      expect(res.locals.feComponents.cssIncludes[1]).toEqual('footer.css')
      expect(res.locals.feComponents.jsIncludes[1]).toEqual('footer.js')
    })
  })

  describe('When fallback is requested', () => {
    it('must not call getComponents()', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', useFallbacksByDefault: true })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(ComponentApiClientModule.getComponents).not.toHaveBeenCalled()
    })

    it('return the content of the header fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', useFallbacksByDefault: true })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.header).toContain('probation-common-fallback-header__link')
    })

    it('return the content of the footer fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', useFallbacksByDefault: true })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.footer).toContain('probation-common-fallback-footer')
      expect(res.locals.feComponents.cssIncludes).toHaveLength(0)
      expect(res.locals.feComponents.jsIncludes).toHaveLength(0)
    })

    it('returns the content of the header fallback component when a user defined class is added', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', useFallbacksByDefault: true, classes: 'my-classes' })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.header).toContain('probation-common-fallback-header__link')
      expect(res.locals.feComponents.header).toContain('my-classes')
      // expect(res.locals.feComponents.header).toEqual('header')
    })

    it('returns the content of the footer fallback component when a user defined header class is added', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', useFallbacksByDefault: true, classes: 'my-classes' })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.footer).toContain('probation-common-fallback-footer')
      expect(res.locals.feComponents.cssIncludes).toHaveLength(0)
      expect(res.locals.feComponents.jsIncludes).toHaveLength(0)
    })
  })

  describe('when no user token is provided', () => {
    it('must not call getComponents()', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '' })
      const req = {} as Request
      const res = createResponseObjectWithNoUser()
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(ComponentApiClientModule.getComponents).not.toHaveBeenCalled()
    })

    it('return the content of the header fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '' })
      const req = {} as Request
      const res = createResponseObjectWithNoUser()
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.header).toContain('probation-common-fallback-header__link')
    })

    it('return the content of the footer fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '' })
      const req = {} as Request
      const res = createResponseObjectWithNoUser()
      jest.spyOn(ComponentApiClientModule, 'getComponents')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.footer).toContain('probation-common-fallback-footer')
      expect(res.locals.feComponents.cssIncludes).toHaveLength(0)
      expect(res.locals.feComponents.jsIncludes).toHaveLength(0)
    })
  })

  describe('When getComponents() call throws', () => {
    it('return the content of the header fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', logger: fakeLogger() })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents').mockRejectedValue('some sort of exception')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.header).toContain('probation-common-fallback-header__link')
    })

    it('return the content of the footer fallback component', async () => {
      // Given
      const middleware = getFrontendComponents({ pdsUrl: '', logger: fakeLogger() })
      const req = {} as Request
      const res = createResponseObject('phUw9cruyosubane')
      jest.spyOn(ComponentApiClientModule, 'getComponents').mockRejectedValue('some sort of exception')

      // When
      await middleware(req, res, jest.fn() as NextFunction)

      // Then
      expect(res.locals.feComponents).toBeDefined()
      expect(res.locals.feComponents.footer).toContain('probation-common-fallback-footer')
      expect(res.locals.feComponents.cssIncludes).toHaveLength(0)
      expect(res.locals.feComponents.jsIncludes).toHaveLength(0)
    })
  })
})
