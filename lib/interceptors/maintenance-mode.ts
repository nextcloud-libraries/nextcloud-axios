/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { CancelableAxiosInstance } from '../client.ts'
import type { InterceptorErrorHandler } from './index.ts'

import { isAxiosError } from 'axios'

export const RETRY_DELAY_KEY = Symbol('retryDelay')

/**
 * Handles Nextcloud maintenance mode errors in Axios requests.
 *
 * @param axios - The current Axios instance
 */
export function onMaintenanceModeError(axios: CancelableAxiosInstance): InterceptorErrorHandler {
	return async (error: unknown) => {
		if (!isAxiosError(error)) {
			throw error
		}

		const { config, response, request } = error
		const responseURL = request?.responseURL
		const status = response?.status
		const headers = response?.headers
		let retryDelay = typeof config?.[RETRY_DELAY_KEY] === 'number'
			? config?.[RETRY_DELAY_KEY]
			: 1

		/**
		 * Retry requests if they failed due to maintenance mode
		 *
		 * The delay is exponential. It starts at 2s and then doubles
		 * until a final retry after 32s. This results in roughly 1m of
		 * retries until we give up and throw the axios error towards
		 * the caller.
		 */
		if (status === 503
			&& headers?.['x-nextcloud-maintenance-mode'] === '1'
			&& config?.retryIfMaintenanceMode
		) {
			retryDelay *= 2
			if (retryDelay > 32) {
				console.error('Retry delay exceeded one minute, giving up.', { responseURL })
				throw error
			}

			console.warn(`Request to ${responseURL} failed because of maintenance mode. Retrying in ${retryDelay}s`)
			await new Promise((resolve) => {
				setTimeout(resolve, retryDelay * 1000)
			})

			return axios({
				...config,
				[RETRY_DELAY_KEY]: retryDelay,
			})
		}

		throw error
	}
}
