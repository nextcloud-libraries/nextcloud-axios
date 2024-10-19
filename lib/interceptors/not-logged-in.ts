/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const onError = async (error) => {
	const { config, response, request } = error
	const responseURL = request?.responseURL
	const status = response?.status

	if (status === 401
		&& response?.data?.message === 'Current user is not logged in'
		&& config.reloadExpiredSession
		&& window?.location) {
		console.error(`Request to ${responseURL} failed because the user session expired. Reloading the page …`)

		window.location.reload()
	}

	return Promise.reject(error)
}
