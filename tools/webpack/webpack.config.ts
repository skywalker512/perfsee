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

import { join } from 'path'

import { createCompiler, Configuration } from '@rspack/core'
import { RspackDevServer } from '@rspack/dev-server'
import { defu } from 'defu'
// @ts-expect-error
import emoji from 'remark-emoji'
import images from 'remark-images'

import { watchRoutes, watchGraphqlSchema } from '../codegen'
import { rootPath } from '../utils'

import svgoConfig from './svgo.config.json'

const isProduction = () => process.env.NODE_ENV === 'production'

const config: () => Configuration = () => {
  let publicPath = process.env.PUBLIC_PATH ?? (isProduction() ? '' : 'http://localhost:8080')
  publicPath = publicPath.endsWith('/') ? publicPath : `${publicPath}/`

  return {
    context: rootPath,
    output: {
      path: join(rootPath, 'dist'),
      publicPath,
    },
    devServer: {
      hot: true,
    },

    mode: isProduction() ? 'production' : 'development',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.gql'],
    },

    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.svg$/,
              use: [
                {
                  loader: '@svgr/webpack',
                  options: {
                    icon: true,
                    svgoConfig,
                  },
                },
              ],
              exclude: [/node_modules/],
            },
            {
              test: /\.(png|jpg|gif|svg|webp)$/,
              type: 'asset/resource',
            },
            {
              test: /\.(ttf|eot|woff|woff2)$/i,
              type: 'asset/resource',
            },
            {
              test: /\.mdx?$/,
              use: [
                {
                  loader: '@mdx-js/loader',
                  options: {
                    providerImportSource: '@mdx-js/react',
                    remarkPlugins: [images, emoji],
                  },
                },
              ],
              exclude: /node_modules/,
            },
            {
              test: /\.txt$/,
              type: 'asset/resource',
            },
          ],
        },
      ],
    },
    builtins: {
      decorator: {
        legacy: true,
        emitMetadata: true,
      },
      emotion: {},
      pluginImport: [
        {
          style: false,
          libraryName: 'lodash',
          libraryDirectory: '',
          camelToDashComponentName: false,
        },
      ],
    },
  }
}

export async function startDevServer(entry: string, externalConfig: Configuration) {
  return Promise.all([watchRoutes(), watchGraphqlSchema()]).then(async () => {
    const compiler = createCompiler(defu<Configuration, Configuration[]>(externalConfig, { entry }, config()))
    const serverProxyRoutes = ['/graphql', '/auth', '/oauth2', '/health', '/github', '/docs', '/artifacts']
    const rspackDevServer = new RspackDevServer(
      {
        hot: true,
        historyApiFallback: true,
        proxy: serverProxyRoutes.reduce((obj, route) => {
          obj[route] = {
            target: process.env.PERFSEE_PLATFORM_HOST ?? 'http://localhost:3000',
          }
          return obj
        }, {}),
      },
      compiler,
    )

    await rspackDevServer.start()
    return new Promise(() => {})
  })
}

export async function runWebpack(
  { entry, project }: { entry: string; project: string },
  mode: 'production' | 'development' = 'development',
  externalConfig: Configuration = {},
) {
  const mergedConfig = defu<Configuration, Configuration[]>(
    externalConfig,
    {
      mode,
      entry,
      output: {
        path: join(rootPath, 'dist', project),
        filename: '[name].[contenthash:8].js',
        chunkFilename: '[name].[contenthash:8].js',
      },
    },
    config(),
  )

  if (mode === 'development') {
    return Promise.all([watchRoutes(), watchGraphqlSchema()])
      .then(() => {
        return new Promise(() => {
          createCompiler(mergedConfig).watch({}, (_, stats) => {
            // eslint-disable-next-line no-console
            console.log(stats?.toString({ colors: true }))
          })
        })
      })
      .catch((e) => {
        console.error(e)
      })
  }

  return new Promise<void>((resolve, reject) => {
    createCompiler(mergedConfig).run((err, stats) => {
      if (err) {
        reject(err)
        return
      }
      console.info(stats!.toString({ colors: true }))
      resolve()
    })
  })
}
