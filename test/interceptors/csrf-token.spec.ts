/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelableClient } from '../../lib/client.ts'
import { onCsrfTokenError } from '../../lib/interceptors/csrf-token.ts'

describe('CSRF token', () => {
	const axiosMock = vi.mockObject(cancelableClient)
	const consoleWarn = vi.spyOn(window.console, 'warn')
	const consoleDebug = vi.spyOn(window.console, 'debug')

	beforeEach(() => {
		vi.resetAllMocks()
		consoleWarn.mockImplementation(() => {})
		consoleDebug.mockImplementation(() => {})
	})

	it('does retry', async () => {
		axiosMock.get.mockImplementationOnce(async () => ({
			status: 200,
			data: {
				token: '123',
			},
		} as AxiosResponse))

		const interceptor = onCsrfTokenError(axiosMock)
		await expect(interceptor(mockAxiosError({ message: 'CSRF check failed' }))).resolves.not.toThrowError()
		expect(axiosMock.get).toHaveBeenCalled()
		expect(axiosMock.defaults.headers.requesttoken).toBe('123')
		expect(consoleDebug).toHaveBeenCalledWith('New request token 123 fetched')
	})

	it('does not retry if wrong message is returned', async () => {
		const interceptor = onCsrfTokenError(axiosMock)
		await expect(() => interceptor(mockAxiosError('wrong data'))).rejects.toThrowError()
		expect(axiosMock.get).not.toHaveBeenCalled()
		expect(consoleDebug).not.toHaveBeenCalled()
	})

	it('does not retry with unrelated error', async () => {
		const interceptor = onCsrfTokenError(axiosMock)
		await expect(() => interceptor(new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST))).rejects.toThrowError()
		expect(axiosMock.get).not.toHaveBeenCalled()
		expect(consoleDebug).not.toHaveBeenCalled()
	})

	it('does not retry multiple times', async () => {
		axiosMock.get.mockImplementationOnce(async (url, config) => {
			throw mockAxiosError({ message: 'CSRF check failed' }, config)
		})

		const interceptor = onCsrfTokenError(axiosMock)
		await expect(interceptor(mockAxiosError({ message: 'CSRF check failed' }))).rejects.toThrowError()
		expect(axiosMock.get).toHaveBeenCalledOnce()
		expect(consoleDebug).not.toHaveBeenCalled()
	})
})

/**
 * @param data - The data to be returned in the error response
 * @param config - The Axios request configuration
 */
function mockAxiosError(data = {}, config = {}) {
	return new AxiosError(
		'Unauthorized',
		AxiosError.ERR_BAD_REQUEST,
		config as InternalAxiosRequestConfig,
		{
			responseURL: '/some/url',
		},
		{
			config: config as InternalAxiosRequestConfig,
			headers: {},
			data,
			status: 412,
			statusText: 'Precondition Failed',
		},
	)
}
