/**
 * SPDX-FileCopyrightText: 2020-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { AxiosInstance, CancelTokenStatic } from 'axios'

import { getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'
import Axios from 'axios'
import { onError as onCsrfTokenError } from './interceptors/csrf-token.ts'
import { onError as onMaintenanceModeError } from './interceptors/maintenance-mode.ts'
import { onError as onNotLoggedInError } from './interceptors/not-logged-in.ts'

interface CancelableAxiosInstance extends AxiosInstance {
	CancelToken: CancelTokenStatic
	isCancel: typeof Axios.isCancel
}

declare module 'axios' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- needed as we extend the interface only.
	interface AxiosRequestConfig<D = any> {
		/**
		 * Only available if the Axios instance from `@nextcloud/axios` is used.
		 * If set to `true`, the interceptor will reload the page when a 401 response is received
		 * and the error message indicates that the user is not logged in.
		 *
		 * @default false
		 */
		reloadExpiredSession?: boolean
	}
}

const client = Axios.create({
	headers: {
		requesttoken: getRequestToken() ?? '',
		'X-Requested-With': 'XMLHttpRequest',
	},
})

const cancelableClient: CancelableAxiosInstance = Object.assign(client, {
	CancelToken: Axios.CancelToken,
	isCancel: Axios.isCancel,
})

cancelableClient.interceptors.response.use((r) => r, onCsrfTokenError(cancelableClient))
cancelableClient.interceptors.response.use((r) => r, onMaintenanceModeError(cancelableClient))
cancelableClient.interceptors.response.use((r) => r, onNotLoggedInError)

onRequestTokenUpdate((token) => {
	client.defaults.headers.requesttoken = token
})

export default cancelableClient

export { isAxiosError, isCancel } from 'axios'

export type * from 'axios'
