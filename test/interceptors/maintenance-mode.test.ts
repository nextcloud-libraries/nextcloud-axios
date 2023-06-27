import { onError } from '../../lib/interceptors/maintenance-mode'
import { jest } from '@jest/globals'

describe('maintenance mode interceptor', () => {

	let axiosMock
	let consoleMock
	let interceptor

	beforeEach(() => {
		axiosMock = jest.fn()
		consoleMock = jest.spyOn(window.console, 'warn').mockImplementation(() => {})
		interceptor = onError(axiosMock)
	})
	afterAll(() => consoleMock.mockRestore())

	it('does not retry HTTP404', async () => {
		try {
			await interceptor({
				config: {},
				response: {
					status: 404,
					headers: {},
				},
				request: {
					responseURL: '/some/url',
				},
			})
		} catch (e) {
			expect(e.response.status).toBe(404)
			expect(axiosMock).not.toHaveBeenCalled()
			return
		}
		fail('Should not be reached')
	})

	it('does not retry if not asked to', async () => {
		try {
			await interceptor({
				config: {},
				response: {
					status: 503,
					headers: {
						'x-nextcloud-maintenance-mode': '1',
					},
				},
				request: {
					responseURL: '/some/url',
				},
			})
		} catch (e) {
			expect(e.response.status).toBe(503)
			expect(axiosMock).not.toHaveBeenCalled()
			return
		}
		fail('Should not be reached')
	})

	it('does not retry if header missing', async () => {
		try {
			await interceptor({
				config: {
					retryIfMaintenanceMode: true,
				},
				response: {
					status: 503,
					headers: {},
				},
				request: {
					responseURL: '/some/url',
				},
			})
		} catch (e) {
			expect(e.response.status).toBe(503)
			expect(axiosMock).not.toHaveBeenCalled()
			return
		}
		fail('Should not be reached')
	})

	it('does not retry if tried too often', async () => {
		axiosMock.mockReturnValue(42)
		const callWithConfig = async (config = {}) => {
			const response = await interceptor({
				config: {
					retryIfMaintenanceMode: true,
					...config,
				},
				response: {
					status: 503,
					headers: {
						'x-nextcloud-maintenance-mode': '1',
					},
				},
				request: {
					responseURL: '/some/url',
				},
			})

			expect(axiosMock).toHaveBeenCalled()
			expect(response).toBe(42)
		}

		// Call one time to get the symbol
		await callWithConfig()
		const retryKey = Object.getOwnPropertySymbols(axiosMock.mock.calls[0][0])[0]

		// This time the retry delay is too high so it should throw an error
		try {
			await callWithConfig({ [retryKey]: 64 })
		} catch (e) {
			expect(e.response.status).toBe(503)
			expect(axiosMock).toHaveBeenCalledTimes(1)
			return
		}
		fail('Should not be reached')
	})

	it('does retry', async () => {
		axiosMock.mockReturnValue(42)
		const response = await interceptor({
			config: {
				retryIfMaintenanceMode: true,
			},
			response: {
				status: 503,
				headers: {
					'x-nextcloud-maintenance-mode': '1',
				},
			},
			request: {
				responseURL: '/some/url',
			},
		})

		expect(axiosMock).toHaveBeenCalled()
		expect(consoleMock).toHaveBeenCalled()
		expect(response).toBe(42)
	})

	it('intercepts a cancellation error', async () => {
		const cancelError = {
			code: 'ERR_CANCELED',
			message: 'canceled',
			name: 'CanceledError',
			stack: '',
		}
		try {
			await interceptor(cancelError)
		} catch (error) {
			expect(error).toEqual(cancelError)
			return
		}
		fail('Should not be reached')
	})
})
