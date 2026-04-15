/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCancelableClient } from '../../lib/client.ts'
import { onMaintenanceModeError } from '../../lib/interceptors/maintenance-mode.ts'
import { mockRequests } from '../mockRequests.ts'

const server = mockRequests()

// interceptors
const httpGateWayTimeout = http.get('/index.php/api', () => HttpResponse.json({ message: 'Gateway Timeout' }, { status: 504, statusText: 'Gateway Timeout' }))
const httpServiceUnavailable = http.get('/index.php/api', () => HttpResponse.json({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' }))
function getHttpMaintenanceMode(retries = 2) {
	return http.get('/index.php/api', () => {
		if (--retries <= 0) {
			return HttpResponse.json({ message: 'ok' })
		}
		return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable', headers: { 'x-nextcloud-maintenance-mode': '1' } })
	})
}

describe('maintenance mode interceptor', () => {
	const consoleWarn = vi.spyOn(window.console, 'warn')
	const consoleError = vi.spyOn(window.console, 'error')

	beforeEach(() => {
		vi.resetAllMocks()
		vi.useFakeTimers()
		consoleWarn.mockImplementation(() => {})
		consoleError.mockImplementation(() => {})
	})

	it('does retry', async () => {
		server.resetHandlers(getHttpMaintenanceMode())

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api', { retryIfMaintenanceMode: true })
		await expect(request).resolves.not.toThrow()
		vi.setTimerTickMode('manual')

		// now advance the timers 1/2 of timeout
		await vi.advanceTimersByTimeAsync(1000)
		expect(server.requests).toHaveLength(1)

		// now check that after the full timeout the request is retried
		await vi.advanceTimersByTimeAsync(1000)
		vi.setTimerTickMode('nextTimerAsync')
		await expect(response).resolves.not.toThrow()
		expect(server.requests).toHaveLength(2)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		expect(server.requests[1].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		expect(consoleWarn).toHaveBeenCalledOnce()
		expect(consoleError).not.toHaveBeenCalledOnce()
	})

	it('does retry up to 32s (5 times)', async () => {
		server.resetHandlers(getHttpMaintenanceMode(6))

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api', { retryIfMaintenanceMode: true })
		await expect(request).resolves.not.toThrow()

		expect(server.requests).toHaveLength(1)

		vi.setTimerTickMode('nextTimerAsync')
		for (let i = 1; i <= 5; i++) {
			const r = new Promise((r) => server.events.on('request:match', r))
			await vi.advanceTimersByTimeAsync(1000 * (2 ** i))
			await expect(r).resolves.not.toThrow()
			expect(server.requests).toHaveLength(i + 1)
			expect(server.requests[i].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		}

		await expect(response).resolves.not.toThrow()
		expect(consoleWarn).toHaveBeenCalledTimes(5)
		expect(consoleError).not.toHaveBeenCalled()
	})

	it('gives up after 32s (on 6st retry)', async () => {
		server.resetHandlers(getHttpMaintenanceMode(7))

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api', { retryIfMaintenanceMode: true })
		await expect(request).resolves.not.toThrow()

		expect(server.requests).toHaveLength(1)

		vi.setTimerTickMode('nextTimerAsync')
		for (let i = 1; i <= 5; i++) {
			const r = new Promise((r) => server.events.on('request:match', r))
			await vi.advanceTimersByTimeAsync(1000 * (2 ** i))
			await expect(r).resolves.not.toThrow()
			expect(server.requests).toHaveLength(i + 1)
			expect(server.requests[i].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
		}

		await expect(response).rejects.toThrow()
		expect(server.requests).toHaveLength(6)
		expect(consoleWarn).toHaveBeenCalledTimes(5)
		expect(consoleError).toHaveBeenCalledOnce()
	})

	it('does not retry without config option', async () => {
		server.resetHandlers(getHttpMaintenanceMode())

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api')
		await expect(request).resolves.not.toThrow()

		vi.setTimerTickMode('nextTimerAsync')
		await vi.advanceTimersByTimeAsync(2500)

		await expect(response).rejects.toThrow()
		expect(server.requests).toHaveLength(1)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
	})

	it('does not retry without header', async () => {
		server.resetHandlers(httpServiceUnavailable)

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api', { retryIfMaintenanceMode: true })
		await expect(request).resolves.not.toThrow()

		vi.setTimerTickMode('nextTimerAsync')
		await vi.advanceTimersByTimeAsync(2500)

		await expect(response).rejects.toThrow()
		expect(server.requests).toHaveLength(1)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
	})

	it('does not retry with wrong status code', async () => {
		server.resetHandlers(httpGateWayTimeout)

		// wait for the first request to be made
		const request = new Promise((resolve) => server.events.on('request:match', resolve))
		const response = getAxios().get('/index.php/api', { retryIfMaintenanceMode: true })
		await expect(request).resolves.not.toThrow()

		vi.setTimerTickMode('nextTimerAsync')
		await vi.advanceTimersByTimeAsync(2500)

		await expect(response).rejects.toThrow()
		expect(server.requests).toHaveLength(1)
		expect(server.requests[0].url).toMatchInlineSnapshot('"http://localhost:63315/index.php/api"')
	})
})

/**
 * Get an axios instance with the maintenance mode interceptor attached
 */
function getAxios() {
	const axios = getCancelableClient()
	axios.interceptors.response.use((r) => r, onMaintenanceModeError(axios))
	return axios
}
