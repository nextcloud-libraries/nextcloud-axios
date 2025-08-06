/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isAxiosError } from 'axios'

/**
 * Axios response interceptor onError callback.
 * This interceptor checks if the response failed because of a expired user session
 * and if enabled it will cause a redirect to the login.
 *
 * @param error - The response error
 */
export async function onNotLoggedInError(error: unknown) {
	if (isAxiosError(error)) {
		const { config, response, request } = error
		const responseURL = request?.responseURL
		const status = response?.status

		if (status === 401
			&& response?.data?.message === 'Current user is not logged in'
			&& config?.reloadExpiredSession
			&& window?.location
		) {
			console.error(`Request to ${responseURL} failed because the user session expired. Reloading the page …`)

			window.location.reload()
		}
	}

	throw error
}
