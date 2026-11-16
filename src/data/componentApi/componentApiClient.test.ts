import nock from 'nock'
import type bunyan from 'bunyan'
import ComponentApiClientModule from './componentApiClient'
import config from '../../config'

describe('getComponents', () => {
  const api = () => nock(config.apis.feComponents.url)

  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  const createLogger = () =>
    ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }) as unknown as bunyan

  const createResponse = async (log: bunyan, userclass?: string, timeoutOptions = { response: 2500, deadline: 2500 }) =>
    ComponentApiClientModule.getComponents({
      log,
      timeoutOptions,
      userToken: 'userToken',
      classes: userclass,
    })

  it('fetches the content of the header and footer', async () => {
    // Given
    const logger = createLogger()
    const scope = api()
      .get('/api/components')
      .query({ component: ['header', 'footer'] })
      .matchHeader('x-user-token', 'userToken')
      .reply(200, { id: 42, name: 'Alice' })

    // When
    const response = await createResponse(logger)

    // Then
    expect(response).toEqual({ id: 42, name: 'Alice' })
    expect(scope.isDone()).toBe(true)
  })

  it('fetches the content of the header and footer with classes', async () => {
    // Given
    const logger = createLogger()
    const scope = api()
      .get('/api/components')
      .query({ component: ['header', 'footer'], classes: 'my-class' })
      .matchHeader('x-user-token', 'userToken')
      .reply(200, { id: 42, name: 'Alice' })

    // When
    const response = await createResponse(logger, 'my-class')

    // Then
    expect(response).toEqual({ id: 42, name: 'Alice' })
    expect(scope.isDone()).toBe(true)
  })

  it('forwards the provided user token', async () => {
    // Given
    const logger = createLogger()
    const scope = api()
      .get('/api/components')
      .query(true)
      .matchHeader('x-user-token', 'userToken')
      .reply(200, { ok: true })

    // When
    await createResponse(logger)

    // Then
    expect(scope.isDone()).toBe(true)
  })

  it('requests using the configured API URL', async () => {
    // Given
    const logger = createLogger()
    const scope = nock('http://fe-components').get('/api/components').query(true).reply(200, { ok: true })

    // When
    await createResponse(logger)

    // Then
    expect(scope.isDone()).toBe(true)
  })

  it('returns the body of the Response', async () => {
    // Given
    const logger = createLogger()
    api().get('/api/components').query(true).reply(200, { id: 42, name: 'Alice' })

    // When
    const response = await createResponse(logger)

    // Then
    expect(response).toEqual({ id: 42, name: 'Alice' })
  })

  it('retries once on retryable API errors', async () => {
    // Given
    const logger = createLogger()
    const scope = api()
      .get('/api/components')
      .query(true)
      .reply(500)
      .get('/api/components')
      .query(true)
      .reply(200, { recovered: true })

    // When
    const response = await createResponse(logger)

    // Then
    expect(response).toEqual({ recovered: true })
    expect(scope.isDone()).toBe(true)
  })

  it('logs when the retry handler finds an API error', async () => {
    // Given
    const logger = createLogger()
    api()
      .get('/api/components')
      .query(true)
      .replyWithError({ code: 'ECONNRESET', message: 'socket hang up' })
      .get('/api/components')
      .query(true)
      .reply(200, { recovered: true })

    // When
    await createResponse(logger, undefined, { response: 50, deadline: 50 })

    // Then — SuperAgent may surface the nock error as ECONNRESET or a timeout abort
    expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/^Retry handler found API error with /))
  })

  it('does not exceed a single retry', async () => {
    // Given
    const logger = createLogger()
    const scope = api().get('/api/components').query(true).reply(500).get('/api/components').query(true).reply(500)

    // When / Then
    await expect(createResponse(logger)).rejects.toThrow()
    expect(scope.isDone()).toBe(true)
  })
})
