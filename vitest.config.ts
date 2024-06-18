/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { defineConfig } from 'vitest/config'
import config from './vite.config'

export default defineConfig(async (env) => {
	const viteConfig = (await config(env))
	delete viteConfig.define

	return {
		...viteConfig,
		test: {
			environment: 'happy-dom',
			coverage: {
				include: ['lib/**/*.ts', 'lib/*.ts'],
				exclude: ['test/'],
			},
			// Fix unresolvable .css extension for ssr
			server: {
				deps: {
					inline: [/@nextcloud\/vue/],
				},
			},
		},
	}
})
