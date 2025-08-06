/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { generateUrl } from '@nextcloud/router'

const RETRY_KEY = Symbol('csrf-retry')

/**
 * Handle CSRF token errors in Axios requests.
 *
 * @param axios - The axios instance the interceptor is attached to
 */
export function onError(axios) {
	return async (error) => {
		const { config, response, request } = error
		const responseURL = request?.responseURL
		const status = response?.status

		if (status === 412
			&& response?.data?.message === 'CSRF check failed'
			&& config[RETRY_KEY] === undefined) {
			console.warn(`Request to ${responseURL} failed because of a CSRF mismatch. Fetching a new token`)

			const { data: { token } } = await axios.get(generateUrl('/csrftoken'))
			console.debug(`New request token ${token} fetched`)
			axios.defaults.headers.requesttoken = token

			return axios({
				...config,
				headers: {
					...config.headers,
					requesttoken: token,
				},
				[RETRY_KEY]: true,
			})
		}

		return Promise.reject(error)
	}
}
