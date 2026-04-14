/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCancelableClient } from '../../lib/client.ts'
import { onNotLoggedInError } from '../../lib/interceptors/not-logged-in.ts'
import { mockRequests } from '../mockRequests.ts'

import '../../lib/custom-config.ts'

const server = mockRequests()

// interceptors
const httpNotLoggedIn = http.get('/index.php/api', () => HttpResponse.json({ message: 'Current user is not logged in' }, { status: 401, statusText: 'Unauthorized' }))
const httpUnauthorized = http.get('/index.php/api', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' }))

describe('not logged in interceptor', () => {
	const consoleMock = vi.spyOn(window.console, 'error')
	const spyReload = vi.fn()

	beforeEach(() => {
		vi.resetAllMocks()
		globalThis.OC = { reload: spyReload }
		consoleMock.mockImplementationOnce(() => {})
	})

	it('does reload when it should', async () => {
		server.resetHandlers(httpNotLoggedIn)

		await expect(getAxios().get('/index.php/api', { reloadExpiredSession: true }))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(1)
		expect(spyReload).toHaveBeenCalledOnce()
	})

	it('does not reload arbitrary 401s', async () => {
		server.resetHandlers(httpUnauthorized)

		await expect(getAxios().get('/index.php/api', { reloadExpiredSession: true }))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(1)
		expect(spyReload).not.toHaveBeenCalledOnce()
	})

	it('does not reload if not asked to', async () => {
		server.resetHandlers(httpNotLoggedIn)

		await expect(getAxios().get('/index.php/api'))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(1)
		expect(spyReload).not.toHaveBeenCalledOnce()
	})
})

/**
 * Get a new axios instance with the not-logged-in interceptor attached.
 */
function getAxios() {
	const axios = getCancelableClient()
	axios.interceptors.response.use((r) => r, onNotLoggedInError)
	return axios
}
