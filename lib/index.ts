/**
 * SPDX-FileCopyrightText: 2020-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { cancelableClient } from './client.ts'
import { onCsrfTokenError } from './interceptors/csrf-token.ts'
import { onMaintenanceModeError } from './interceptors/maintenance-mode.ts'
import { onNotLoggedInError } from './interceptors/not-logged-in.ts'

cancelableClient.interceptors.response.use((r) => r, onCsrfTokenError(cancelableClient))
cancelableClient.interceptors.response.use((r) => r, onMaintenanceModeError(cancelableClient))
cancelableClient.interceptors.response.use((r) => r, onNotLoggedInError)

export type * from 'axios'
export type * from './custom-config.ts'
export { isAxiosError, isCancel } from 'axios'
export default cancelableClient
