/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { recommendedLibrary } from '@nextcloud/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
	...recommendedLibrary,
	{
		rules: {
			// we do not have access to the logger right now
			'no-console': 'off',
		},
	},
])
