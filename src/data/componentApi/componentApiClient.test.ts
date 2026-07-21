import type bunyan from 'bunyan'

// const mockGet = jest.fn().mockReturnThis() // Allows chaining after .get()
const mockSet = jest.fn().mockReturnThis() // Allows chaining after .set()
const mockQuery = jest.fn().mockReturnThis() // Allows chaining after .query()
const mockRetry = jest.fn().mockReturnThis() // Allows chaining after .send()
const mockSend = jest.fn().mockReturnThis() // Allows chaining after .retry()
const mockTimeout = jest.fn().mockReturnThis() // Allows chaining after .timeout()

jest.mock('superagent', () => {
  const mockChain = {
    // get: mockGet, // Allows chaining after .get()
    set: mockSet, // Allows chaining after .set()
    query: mockQuery, // Allows chaining after .query()
    retry: mockRetry, // Allows chaining after .send()
    send: mockSend, // Allows chaining after .retry()
    timeout: mockTimeout, // Allows chaining after .timeout()
    // Make the chain object awaitable by implementing a custom .then()
    then: jest.fn(resolve => resolve({ body: { id: 42, name: 'Alice' } })),
  }

  return {
    get: jest.fn(() => mockChain),
    post: jest.fn(() => mockChain),
    put: jest.fn(() => mockChain),
    retry: jest.fn(() => mockChain),
    timeout: jest.fn(() => mockChain),
  }
})

// needed so that superagent module is mocked up in the Component module
import superagent from 'superagent' // eslint-disable-line import/first
import ComponentApiClientModule from './componentApiClient' // eslint-disable-line import/first

describe('getComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks() // Clear call histories between tests
  })

  const createLogger = () =>
    ({
      info: jest.fn(),
    }) as bunyan

  const createResponse = async (log: bunyan, userclass?: string) =>
    ComponentApiClientModule.getComponents({
      log,
      timeoutOptions: { response: 2500, deadline: 2500 },
      userToken: 'userToken',
      classes: userclass,
    })

  it('fetches the content of the header and footer', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger)

    // Then
    expect(mockQuery).toHaveBeenCalledWith('component=header&component=footer')
  })

  it('fetches the content of the header and footer', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger, 'my-class')

    // Then
    expect(mockQuery).toHaveBeenCalledWith('component=header&component=footer&classes=my-class')
  })

  it('forward the provided user token', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger)

    // Then
    expect(mockSet).toHaveBeenCalledWith({ 'x-user-token': 'userToken' })
  })

  it('must retry at least once', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger)

    // Then
    const firstRetryArgument = mockRetry.mock.calls[0][0]
    expect(firstRetryArgument).toEqual(1)
  })

  it('request using the configured API URL', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger)

    // Then
    expect(superagent.get).toHaveBeenCalledWith('http://fe-components/api/components')
  })

  it('sets the value of the timeout setting provided', async () => {
    // Given
    const logger = createLogger()

    // When
    await createResponse(logger)

    // Then
    expect(mockTimeout).toHaveBeenCalledWith({ deadline: 2500, response: 2500 })
  })

  it('returns the body of the Response', async () => {
    // Given
    const logger = createLogger()

    // When
    const response = await createResponse(logger)

    // Then
    expect(response).toEqual({ id: 42, name: 'Alice' })
  })
})
