/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { InternalAxiosRequestConfig } from 'axios'

import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelableClient } from '../../lib/client.ts'
import { onMaintenanceModeError, RETRY_DELAY_KEY } from '../../lib/interceptors/maintenance-mode.ts'

describe('maintenance mode interceptor', () => {
	const axiosMock = vi.mockObject(cancelableClient)
	const consoleWarn = vi.spyOn(window.console, 'warn')
	const consoleError = vi.spyOn(window.console, 'error')

	beforeEach(() => {
		vi.resetAllMocks()
		vi.useFakeTimers()
		consoleWarn.mockImplementation(() => {})
		consoleError.mockImplementation(() => {})
	})

	it('does retry', async () => {
		axiosMock.mockImplementationOnce(async () => ({
			status: 200,
			data: {},
		}))
		const interceptor = onMaintenanceModeError(axiosMock)

		const expectationPromise = expect(interceptor(mockAxiosError('Service Unavailable', 503, { 'x-nextcloud-maintenance-mode': '1' }, { retryIfMaintenanceMode: true }))).resolves.not.toThrowError()
		expect(axiosMock).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(2000)
		await expectationPromise
		expect(axiosMock).toHaveBeenCalledOnce()
		expect(consoleWarn).toHaveBeenCalledOnce()
		expect(consoleError).not.toHaveBeenCalledOnce()
	})

	it('does retry more than 16 times', async () => {
		const interceptor = onMaintenanceModeError(axiosMock)

		const expectationPromise = expect(interceptor(mockAxiosError(
			'Service Unavailable',
			503,
			{ 'x-nextcloud-maintenance-mode': '1' },
			{ retryIfMaintenanceMode: true, [RETRY_DELAY_KEY]: 32 },
		))).rejects.toThrowError()
		expect(axiosMock).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(32000)
		await expectationPromise
		expect(axiosMock).not.toHaveBeenCalledOnce()
		expect(consoleError).toHaveBeenCalledOnce()
	})

	it('does not intercept a cancelation error', async () => {
		const interceptor = onMaintenanceModeError(axiosMock)

		await expect(interceptor(new AxiosError('Canceled', AxiosError.ERR_CANCELED))).rejects.toThrowError()
		await vi.advanceTimersByTimeAsync(2000)
		expect(axiosMock).not.toHaveBeenCalled()
	})

	it('does not retry HTTP-404', async () => {
		const interceptor = onMaintenanceModeError(axiosMock)

		await expect(interceptor(mockAxiosError('Not Found', 404))).rejects.toThrowError()
		await vi.advanceTimersByTimeAsync(2000)
		expect(axiosMock).not.toHaveBeenCalled()
	})

	it('does not retry without config option', async () => {
		const interceptor = onMaintenanceModeError(axiosMock)

		await expect(interceptor(mockAxiosError('Service Unavailable', 503, { 'x-nextcloud-maintenance-mode': '1' }))).rejects.toThrowError()
		await vi.advanceTimersByTimeAsync(2000)
		expect(axiosMock).not.toHaveBeenCalled()
	})

	it('does not retry without header', async () => {
		const interceptor = onMaintenanceModeError(axiosMock)

		await expect(interceptor(mockAxiosError('Service Unavailable', 503, {}, { retryIfMaintenanceMode: true }))).rejects.toThrowError()
		await vi.advanceTimersByTimeAsync(2000)
		expect(axiosMock).not.toHaveBeenCalled()
	})
})

/**
 * @param statusText - The status text of the error
 * @param status - The HTTP status code of the error
 * @param headers - The headers of the error response
 */
function mockAxiosError(statusText: string, status: number, headers = {}, config = {}) {
	return new AxiosError(
		statusText,
		AxiosError.ERR_BAD_REQUEST,
		config as InternalAxiosRequestConfig,
		{
			responseURL: '/some/url',
		},
		{
			config: config as InternalAxiosRequestConfig,
			headers,
			data: {},
			status,
			statusText,
		},
	)
}
