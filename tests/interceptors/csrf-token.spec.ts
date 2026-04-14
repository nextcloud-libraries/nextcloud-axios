/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCancelableClient } from '../../lib/client.ts'
import { onCsrfTokenError } from '../../lib/interceptors/csrf-token.ts'
import { mockRequests } from '../mockRequests.ts'

const server = mockRequests()

// interceptors
const httpTokenOk = http.get('/index.php/csrftoken', () => HttpResponse.json({ token: '123' }))
const httpBadRequest = http.get('/index.php/api', () => HttpResponse.json({ message: 'CSRF check failed' }, { status: 400, statusText: 'Bad Request' }))
const httpPrecoditionFailed = http.get('/index.php/api', () => HttpResponse.json({ message: 'Generic error' }, { status: 412, statusText: 'Precondition Failed' }))
const httpCsrfFailed = http.get('/index.php/api', () => HttpResponse.json({ message: 'CSRF check failed' }, { status: 412, statusText: 'Precondition Failed' }))
function getCsrfErrorHandler() {
	let handled = false
	return http.get('/index.php/api', () => {
		if (handled) {
			return HttpResponse.json({ success: true })
		} else {
			handled = true
			return HttpResponse.json({ message: 'CSRF check failed' }, { status: 412, statusText: 'Precondition Failed' })
		}
	})
}

describe('CSRF token', () => {
	const consoleWarn = vi.spyOn(window.console, 'warn')
	const consoleDebug = vi.spyOn(window.console, 'debug')

	beforeEach(() => {
		vi.resetAllMocks()
		consoleWarn.mockImplementation(() => {})
		consoleDebug.mockImplementation(() => {})
	})

	it('does retry', async () => {
		server.resetHandlers(httpTokenOk, getCsrfErrorHandler())

		const axios = getAxios()
		await expect(axios.get('/index.php/api'))
			.resolves.not.toThrow()

		expect(server.requests).toHaveLength(3)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		expect(server.requests[1].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/csrftoken"')
		expect(server.requests[2].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		expect(axios.defaults.headers.requesttoken).toBe('123')
	})

	it('does not retry if wrong message is returned', async () => {
		server.resetHandlers(httpTokenOk, httpPrecoditionFailed)

		await expect(getAxios().get('/index.php/api'))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(1)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
	})

	it('does not retry with unrelated error', async () => {
		server.resetHandlers(httpTokenOk, httpBadRequest)

		await expect(getAxios().get('/index.php/api'))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(1)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
	})

	it('does not retry multiple times', async () => {
		server.resetHandlers(httpTokenOk, httpCsrfFailed)

		await expect(getAxios().get('/index.php/api'))
			.rejects.toThrow()

		expect(server.requests).toHaveLength(3)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"') // ok, throws but we try again
		expect(server.requests[1].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/csrftoken"') // we fetch a new token
		expect(server.requests[2].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"') // failed again no more retries
	})
})

/**
 * Get a new axios instance with the csrf token interceptor attached.
 */
function getAxios() {
	const axios = getCancelableClient()
	axios.interceptors.response.use((r) => r, onCsrfTokenError(axios))
	return axios
}
