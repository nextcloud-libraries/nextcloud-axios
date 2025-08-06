/*!
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 */

import type { AxiosInstance, CancelTokenStatic } from 'axios'

import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'
import Axios from 'axios'

export interface CancelableAxiosInstance extends AxiosInstance {
	CancelToken: CancelTokenStatic
	isCancel: typeof Axios.isCancel
}

const client = Axios.create({
	headers: {
		requesttoken: getRequestToken() ?? '',
		'X-Requested-With': 'XMLHttpRequest',
	},
})

onRequestTokenUpdate((token: string) => {
	client.defaults.headers.requesttoken = token
})

export const cancelableClient: CancelableAxiosInstance = Object.assign(client, {
	CancelToken: Axios.CancelToken,
	isCancel: Axios.isCancel,
})
