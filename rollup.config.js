import typescript from '@rollup/plugin-typescript'

const external = ['axios', '@nextcloud/auth', '@nextcloud/router']

export default [
  {
    input: 'lib/index.ts',
    external,
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
    ],
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        exports: 'default',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'lib/index.ts',
    external,
    plugins: [typescript()],
    output: [
      {
        file: 'dist/index.es.mjs',
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
]
