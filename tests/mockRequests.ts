/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, beforeEach } from 'vitest'

/**
 * Create a mock service worker and expose the requests it receives for testing purposes.
 */
export function mockRequests() {
	const requests: Request[] = []
	const server = setupWorker()

	beforeAll(async () => {
		// @ts-expect-error -- mocking global variable for testing purposes
		window._oc_webroot = ''
		// Start webworker before all tests
		await server.start({ onUnhandledRequest: 'error', quiet: true })
	})

	beforeEach(() => {
		requests.splice(0, requests.length)
		server.events.removeAllListeners()
		server.events.on('request:match', (req) => requests.push(req.request))
	})

	afterAll(async () => server.stop())

	return Object.assign(server, { requests })
}
