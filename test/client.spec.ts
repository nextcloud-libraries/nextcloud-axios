/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { emit } from '@nextcloud/event-bus'
import { expect, it, vi } from 'vitest'
import { cancelableClient } from '../lib/client.ts'

vi.mock('@nextcloud/auth', async (original) => ({
	...await original(),
	getRequestToken: () => 'initial-token',
}))

it('has initial token set in defaults', () => {
	expect(cancelableClient.defaults.headers.requesttoken).toBe('initial-token')
})

it('has the latest request token', () => {
	emit('csrf-token-update', {
		token: 'ABC123',
	})

	expect(cancelableClient.defaults.headers.requesttoken).toBe('ABC123')
})

it('has a cancel token prop', () => {
	expect(cancelableClient.CancelToken !== undefined).toBe(true)
})

it('creates a new cancel token', () => {
	const token = cancelableClient.CancelToken.source()

	expect(token !== undefined).toBe(true)
	expect(token.token !== undefined).toBe(true)
})
