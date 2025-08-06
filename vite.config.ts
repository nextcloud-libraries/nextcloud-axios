/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { createLibConfig } from '@nextcloud/vite-config'
import { defineConfig } from 'vite'

export default defineConfig((env) => createLibConfig({
	index: 'lib/index.ts',
}, {
	libraryFormats: ['es', 'cjs'],
	DTSPluginOptions: {
		rollupTypes: env.mode === 'production',
	},
})(env))
