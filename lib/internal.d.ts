/*!
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 */

/**
 * THIS is not exposed to the public API, but is used internally in the project.
 */
declare module 'axios' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- needed as we extend the interface only.
	interface AxiosRequestConfig<D = any> {
		_nextcloudCsrfTokenReloaded?: true
		_nextcloudMaintenanceModeRetryDelay?: number
	}
}

declare global {
	var OC: {
		/** NC 32 and before */
		reload?: () => void
	} | undefined
}

export {}
