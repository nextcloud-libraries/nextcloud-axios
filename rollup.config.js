import typescript from '@rollup/plugin-typescript'

const external = ['axios', '@nextcloud/auth', '@nextcloud/router']

export default [
  {
    input: 'lib/index.ts',
    external,
    plugins: [
      typescript({ tsconfig: './tsconfig.json', compilerOptions: { target: 'es5' } }),
    ],
    output: [
      {
        dir: 'dist',
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
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
]
