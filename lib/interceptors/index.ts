/*!
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 */

/**
 * Axios interceptor onError callback
 */
export type InterceptorErrorHandler = (error: unknown) => Promise<unknown> | unknown
