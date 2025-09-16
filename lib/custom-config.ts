/*!
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 */

// public interface for custom configuration of the Axios client
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

		/**
		 * Only available if the Axios instance from `@nextcloud/axios` is used.
		 * If set to `true`, the interceptor will retry the request if it failed
		 * because the server is in maintenance mode.
		 *
		 * @default false
		 */
		retryIfMaintenanceMode?: boolean
	}
}

export {}
