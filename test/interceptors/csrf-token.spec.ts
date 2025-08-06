/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { onError } from '../../lib/interceptors/csrf-token.ts'

describe('CSRF token', () => {
	let axiosMock
	let consoleMock
	let interceptor

	afterAll(() => consoleMock.mockRestore())
	beforeEach(() => {
		consoleMock = vi.spyOn(window.console, 'warn').mockImplementation(() => {})
		axiosMock = vi.fn()
		axiosMock.get = vi.fn()
		axiosMock.defaults = {
			headers: {
				requesttoken: 'old',
			},
		}
		interceptor = onError(axiosMock)
	})

	it('does not retry successful requests', async () => {
		try {
			await interceptor({
				config: {},
				response: {
					status: 200,
					headers: {},
				},
				request: {
					responseURL: '/some/url',
				},
			})
		} catch (e) {
			expect(e.response.status).toBe(200)
			expect(axiosMock).not.toHaveBeenCalled()
			return
		}
		throw new Error('Should not be reached')
	})

	it('does not retry if header missing', async () => {
		try {
			await interceptor({
				config: {
					retryIfMaintenanceMode: true,
				},
				response: {
					status: 412,
					headers: {},
				},
				request: {
					responseURL: '/some/url',
				},
			})
		} catch (e) {
			expect(e.response.status).toBe(412)
			expect(axiosMock).not.toHaveBeenCalled()
			return
		}
		throw new Error('Should not be reached')
	})

	it('does retry', async () => {
		axiosMock.mockReturnValue({
			status: 200,
		})
		axiosMock.get.mockReturnValue(Promise.resolve({
			data: {
				token: '123',
			},
			headers: {},
		}))
		const response = await interceptor({
			config: {},
			response: {
				status: 412,
				data: {
					message: 'CSRF check failed',
				},
			},
			request: {
				responseURL: '/some/url',
			},
		})
		expect(axiosMock).toHaveBeenCalled()
		expect(axiosMock.get).toHaveBeenCalled()
		expect(axiosMock.defaults.headers.requesttoken).toBe('123')
		expect(response?.status).toBe(200)
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
		throw new Error('Should not be reached')
	})
})
