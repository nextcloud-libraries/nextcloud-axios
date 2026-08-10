/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Axios interceptor onError callback
 */
export type InterceptorErrorHandler = (error: unknown) => Promise<unknown> | unknown
