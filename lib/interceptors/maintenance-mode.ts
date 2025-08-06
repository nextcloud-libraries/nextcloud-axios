/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const RETRY_DELAY_KEY = Symbol('retryDelay')

/**
 * Handles Nextcloud maintenance mode errors in Axios requests.
 *
 * @param axios - The current Axios instance
 */
export function onError(axios) {
	return async (error) => {
		const { config, response, request } = error
		const responseURL = request?.responseURL
		const status = response?.status
		const headers = response?.headers

		/**
		 * Retry requests if they failed due to maintenance mode
		 *
		 * The delay is exponential. It starts at 2s and then doubles
		 * until a final retry after 32s. This results in roughly 1m of
		 * retries until we give up and throw the axios error towards
		 * the caller.
		 */
		if (status === 503
			&& headers['x-nextcloud-maintenance-mode'] === '1'
			&& config.retryIfMaintenanceMode
			&& (!config[RETRY_DELAY_KEY] || config[RETRY_DELAY_KEY] <= 32)) {
			const retryDelay = (config[RETRY_DELAY_KEY] ?? 1) * 2
			console.warn(`Request to ${responseURL} failed because of maintenance mode. Retrying in ${retryDelay}s`)
			await new Promise((resolve) => {
				setTimeout(resolve, retryDelay * 1000)
			})

			return axios({
				...config,
				[RETRY_DELAY_KEY]: retryDelay,
			})
		}

		return Promise.reject(error)
	}
}
