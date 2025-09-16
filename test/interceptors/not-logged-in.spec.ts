/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { InternalAxiosRequestConfig } from 'axios'

import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onNotLoggedInError } from '../../lib/interceptors/not-logged-in.ts'

describe('not logged in interceptor', () => {
	const consoleMock = vi.spyOn(window.console, 'error')

	beforeEach(() => {
		vi.resetAllMocks()
		consoleMock.mockImplementationOnce(() => {})
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { reload: vi.fn() },
		})
	})

	it('does reload when it should', async () => {
		await expect(() => onNotLoggedInError(mockAxiosError({ reloadExpiredSession: true }, { message: 'Current user is not logged in' }))).rejects.toThrowError()
		expect(window.location.reload).toHaveBeenCalled()
	})

	it('does not reload arbitrary 401s', async () => {
		await expect(() => onNotLoggedInError(mockAxiosError({}))).rejects.toThrowError()
		expect(window.location.reload).not.toHaveBeenCalled()
	})

	it('does not reload if not asked to', async () => {
		await expect(() => onNotLoggedInError(mockAxiosError({}, { message: 'Current user is not logged in' }))).rejects.toThrowError()
		expect(window.location.reload).not.toHaveBeenCalled()
	})

	it('does not reload on a cancellation error', async () => {
		const cancelError = new AxiosError('canceled', AxiosError.ERR_CANCELED)

		await expect(() => onNotLoggedInError(cancelError)).rejects.toThrowError()
		expect(window.location.reload).not.toHaveBeenCalled()
	})
})

/**
 * This function mocks an Axios error response for testing purposes.
 * It simulates a 401 Unauthorized error, which is commonly used to indicate that the user is not logged in.
 *
 * @param config - The Axios request configuration
 * @param data - The data to be returned in the error response
 */
function mockAxiosError(config = {}, data = {}) {
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
			status: 401,
			statusText: 'Unauthorized',
		},
	)
}
