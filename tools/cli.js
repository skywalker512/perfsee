/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const crypto = require('crypto')
const fs = require('fs')
const { builtinModules } = require('module')
const path = require('path')

const { fdir } = require('fdir')

const cliDeps = [
  path.resolve(__dirname, './cli'),
  path.resolve(__dirname, './webpack'),
  path.resolve(__dirname, './codegen'),
  path.resolve(__dirname, './utils'),
]
const cliSrc = path.resolve(__dirname, './cli/index.ts')
const cliDist = `./cli.generated.${cliHash()}.mjs`
const cliAbsDist = path.resolve(__dirname, cliDist)

function cliHash() {
  const lockHash = crypto.createHash('sha256').update(fs.readFileSync('pnpm-lock.yaml')).digest('hex').substring(0, 5)
  const hasher = crypto.createHash('sha256')

  cliDeps.forEach((cliDep) => {
    new fdir()
      .withFullPaths()
      .crawl(cliDep)
      .sync()
      .forEach((filename) => {
        hasher.update(fs.readFileSync(filename))
      })
  })

  hasher.update(fs.readFileSync(path.resolve(__filename)))
  return lockHash + hasher.digest('hex').substring(0, 5)
}

function cleanup() {
  console.info('Cleaning up old builds...')
  const dir = path.dirname(cliAbsDist)
  fs.readdirSync(dir)
    .filter((desc) => /^cli\.generated\./.test(desc))
    .forEach((desc) => {
      fs.rmSync(path.join(dir, desc))
    })
}

function build() {
  cleanup()
  console.info('Building CLI...')
  /** @type {import('esbuild')} */
  const esbuild = require('esbuild')

  /**
   * @type { import('esbuild').Plugin}
   */
  const externalPlugin = {
    name: 'external-plugin',
    setup: (build) => {
      const builtins = new Set([
        ...builtinModules,
        'emitter',
        'fsevents',
        'pnpapi',
        'vite',
        'webpack',
        'rollup',
        'esbuild',
        '@swc/core',
        '@modern-js/builder',
        '@modern-js/builder-rspack-provider',
      ])
      build.onResolve({ filter: /.*/ }, ({ path: requirePath, kind, importer }) => {
        if (builtins.has(requirePath) || requirePath.startsWith('node:') || kind === 'require-resolve') {
          return {
            external: true,
          }
        }

        if (/^@(perfsee)\//.test(requirePath)) {
          return {
            external: false,
          }
        }

        if (!/^[\w@]/.test(requirePath)) {
          return {
            external: false,
            namespace: 'bundled',
          }
        }

        // if (
        //   [
        //     'inquirer',
        //     'figures',
        //     'is-unicode-supported',
        //     'cli-cursor',
        //     'restore-cursor',
        //     'ansi-escapes',
        //     'wrap-ansi',
        //     'string-width',
        //     'strip-ansi',
        //     'ansi-styles',
        //     'remark-emoji',
        //     'emoticon',
        //     'mdast-util-find-and-replace',
        //   ].includes(requirePath)
        // ) {
        //   return {
        //     external: false,
        //   }
        // }

        if (!importer) {
          return {
            external: false,
          }
        }

        return {
          external: true,
        }
      })

      build.onLoad({ filter: /.(js|ts)$/ }, ({ path: filePath }) => {
        let contents = fs.readFileSync(filePath, 'utf8')
        let loader = path.extname(filePath).substring(1)
        if (loader === 'cjs' || loader === 'mjs') {
          loader = 'js'
        }
        const dirname = path.posix.dirname(filePath)
        contents = contents
          .replace(/([^\w'"_.\s])__dirname([^\w_'"])/g, `$1"${dirname}"$2`)
          .replace(/([^\w'"_.\s])__filename([^\w_'"])/g, `$1"${filePath}"$2`)
        return {
          contents,
          loader,
        }
      })
    },
  }

  return esbuild.build({
    entryPoints: [cliSrc],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: cliAbsDist,
    plugins: [externalPlugin],
    sourcemap: true,
  })
}

const preparasion = fs.existsSync(cliAbsDist) ? Promise.resolve() : build()

preparasion.then(() => {
  import(cliDist)
})
