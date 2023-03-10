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

import { rootPath } from '../utils'

import { RspackConfig } from './webpack.config'

export function getNodeConfig() {
  return {
    devtool: 'source-map',
    resolve: { mainFields: ['esnext', 'module', 'main'] },
    optimization: {
      minimize: false,
      runtimeChunk: false,
    },
    target: 'node',
    // node: false,
    // externals: nodeExternals({
    //   modulesDir: join(rootPath, 'node_modules'),
    //   allowlist: [/@perfsee\/(.*)/],
    // }),
    output: {
      path: join(rootPath, 'output'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    builtins: {
      define: {
        'process.env.BUNDLED': 'true',
      },
    },
  } as RspackConfig
}
