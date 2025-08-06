/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { InternalAxiosRequestConfig } from 'axios'

import { AxiosError } from 'axios'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onError } from '../../lib/interceptors/not-logged-in.ts'

describe('not logged in interceptor', () => {
	const original = window.location
	let consoleMock

	beforeEach(() => {
		consoleMock = vi.spyOn(window.console, 'error').mockImplementation(() => {})
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { reload: vi.fn() },
		})
	})

	afterAll(() => consoleMock.mockRestore())
	afterEach(() => {
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: original,
		})
	})

	it('does not reload arbitrary 401s', async () => {
		try {
			await onError(mockAxiosError({ reloadExpiredSession: true }))
		} catch (e) {
			expect(e.response.status).toBe(401)
			expect(window.location.reload).not.toHaveBeenCalled()
			return
		}
		throw new Error('Should not be reached')
	})

	it('does not reload if not asked to', async () => {
		try {
			await onError(mockAxiosError({}, { message: 'Current user is not logged in' }))
		} catch (e) {
			expect(e.response.status).toBe(401)
			expect(window.location.reload).not.toHaveBeenCalled()
			return
		}
		throw new Error('Should not be reached')
	})

	it('does reload when it should', async () => {
		try {
			await onError(mockAxiosError({ reloadExpiredSession: true }, { message: 'Current user is not logged in' }))
		} catch (e) {
			expect(e.response.status).toBe(401)
			expect(window.location.reload).toHaveBeenCalled()
			return
		}

		throw new Error('Should not be reached because the original error shall bubble up')
	})

	it('intercepts a cancellation error', async () => {
		const cancelError = {
			code: 'ERR_CANCELED',
			message: 'canceled',
			name: 'CanceledError',
			stack: '',
		}
		try {
			await onError(cancelError)
		} catch (error) {
			expect(error).toEqual(cancelError)
			return
		}
		throw new Error('Should not be reached')
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
