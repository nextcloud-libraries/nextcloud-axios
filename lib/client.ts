/*!
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 */

import type { AxiosInstance, CancelTokenStatic } from 'axios'

import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'
import Axios from 'axios'

export interface CancelableAxiosInstance extends AxiosInstance {
	/**
	 * @deprecated - use the AbortController API instead
	 */
	CancelToken: CancelTokenStatic
	isCancel: typeof Axios.isCancel
}

/**
 * Get an Axios instance with default Nextcloud headers and CSRF token handling.
 */
export function getCancelableClient(): CancelableAxiosInstance {
	const client = Axios.create({
		headers: {
			requesttoken: getRequestToken() ?? '',
			'X-Requested-With': 'XMLHttpRequest',
		},
	})

	onRequestTokenUpdate((token: string) => {
		client.defaults.headers.requesttoken = token
	})

	return Object.assign(client, {
		CancelToken: Axios.CancelToken,
		isCancel: Axios.isCancel,
	})
}
