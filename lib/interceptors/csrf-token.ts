/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { CancelableAxiosInstance } from '../client.ts'
import type { InterceptorErrorHandler } from './index.ts'

import { generateUrl } from '@nextcloud/router'
import { isAxiosError } from 'axios'

const RETRY_KEY = '_nextcloudCsrfTokenReloaded'

/**
 * Handle CSRF token errors in Axios requests.
 *
 * @param axios - The axios instance the interceptor is attached to
 */
export function onCsrfTokenError(axios: CancelableAxiosInstance): InterceptorErrorHandler {
	return async (error: unknown) => {
		if (!isAxiosError(error)) {
			throw error
		}

		const { config, response, request } = error
		const responseURL = request?.responseURL

		if (config
			&& !(RETRY_KEY in config)
			&& response?.status === 412
			&& response?.data?.message === 'CSRF check failed') {
			console.warn(`Request to ${responseURL} failed because of a CSRF mismatch. Fetching a new token.`)

			const { data: { token } } = await axios.get(generateUrl('/csrftoken'))
			axios.defaults.headers.requesttoken = token

			return axios({
				...config,
				[RETRY_KEY]: true,
				headers: {
					...config.headers,
					requesttoken: token,
				},
			})
		}

		throw error
	}
}
