import { createLibConfig } from '@nextcloud/vite-config'
import { defineConfig, type UserConfigFn } from 'vite'

export default defineConfig((env) => {
	return createLibConfig({
		index: 'lib/index.ts',
	}, {
		libraryFormats: ['es', 'cjs'],
		DTSPluginOptions: {
			rollupTypes: env.mode === 'production',
		},
	})(env)
}) as UserConfigFn
