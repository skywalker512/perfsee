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

import { Configuration } from '@rspack/core'

import { getPackage, pathToRoot } from '../utils'

export function getFrontendConfig(): Configuration {
  const pkg = getPackage('@perfsee/platform')
  return {
    resolve: { mainFields: ['esnext', 'browser', 'module', 'main'] },
    builtins: {
      define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'production'}"`,
        LOCAL_REPORT: false,
        PERFSEE_PLATFORM_HOST: `"${process.env.PERFSEE_PLATFORM_HOST ?? ''}"`,
        __IS_SERVER__: process.env.__IS_SERVER__ === 'true',
      },
      html: [
        {
          favicon: pathToRoot('assets', 'favicon.ico'),
          template: pathToRoot('packages', 'platform', 'index.html'),
          templateParameters: {
            version: pkg.version,
          },
        },
      ],
    },
    plugins: [],
  }
}
