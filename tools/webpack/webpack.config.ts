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

import { createBuilder } from '@modern-js/builder'
import { builderRspackProvider, ModifyRspackConfigFn, BuilderConfig } from '@modern-js/builder-rspack-provider'
// @ts-expect-error
import emoji from 'remark-emoji'
import images from 'remark-images'

import { watchRoutes, watchGraphqlSchema } from '../codegen'
import { rootPath } from '../utils'

import { svgPluginSvg } from './svg'

const isProduction = () => process.env.NODE_ENV === 'production'

export type RspackConfig = Parameters<ModifyRspackConfigFn>[0]

const config: () => RspackConfig = () => {
  let publicPath = process.env.PUBLIC_PATH ?? (isProduction() ? '' : 'http://localhost:8080')
  publicPath = publicPath.endsWith('/') ? publicPath : `${publicPath}/`

  return {
    context: rootPath,
    output: {
      path: join(rootPath, 'dist'),
      publicPath,
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.gql'],
    },

    module: {
      rules: [
        {
          oneOf: [
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
              loader: 'raw-loader',
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

const commonBuilderConfig: BuilderConfig = {
  output: {
    svgDefaultExport: 'component',
  },
  performance: {
    printFileSize: false,
  },
}

export async function startDevServer(entry: string, externalConfig: RspackConfig) {
  return Promise.all([watchRoutes(), watchGraphqlSchema()]).then(async () => {
    const serverProxyRoutes = ['/graphql', '/auth', '/oauth2', '/health', '/github', '/docs', '/artifacts']
    const provider = builderRspackProvider({
      builderConfig: {
        ...commonBuilderConfig,
        tools: {
          devServer: {
            historyApiFallback: true,
            proxy: serverProxyRoutes.reduce((obj, route) => {
              obj[route] = {
                target: process.env.PERFSEE_PLATFORM_HOST ?? 'http://localhost:3000',
              }
              return obj
            }, {}),
          },
          rspack: (inputConfig, { mergeConfig }) => {
            return mergeConfig(inputConfig, config(), externalConfig)
          },
        },
      },
    })

    const builder = await createBuilder(provider, {
      entry: {
        index: entry,
      },
    })

    builder.addPlugins([svgPluginSvg()])

    await builder.startDevServer()
    return new Promise(() => {})
  })
}

export async function runWebpack(
  { entry, project }: { entry: string; project: string },
  mode: 'production' | 'development' = 'development',
  externalConfig: RspackConfig = {},
) {
  const provider = builderRspackProvider({
    builderConfig: {
      ...commonBuilderConfig,
      output: {
        ...commonBuilderConfig.output,
        distPath: {
          root: join(rootPath, 'dist', project),
        },
      },
      tools: {
        rspack: (inputConfig, { mergeConfig }) => {
          return mergeConfig(inputConfig, config(), externalConfig)
        },
      },
    },
  })

  const builder = await createBuilder(provider, {
    entry: {
      index: entry,
    },
    target: 'node',
  })

  builder.addPlugins([svgPluginSvg()])

  if (mode === 'development') {
    await Promise.all([watchRoutes(), watchGraphqlSchema])
    await builder.build({ mode, watch: true })
  }

  await builder.build()
}
