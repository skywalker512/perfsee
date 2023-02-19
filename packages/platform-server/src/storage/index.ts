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

import { FactoryProvider, Module } from '@nestjs/common'

import { Config } from '../config'

import { ObjectStorage as LocalObjectStorage } from './providers/local'
import { BaseObjectStorage as ObjectStorage } from './providers/provider'
import { ObjectStorage as S3ObjectStorage } from './providers/s3'

/**
 * override in the way like:
 *
 * const artifactProvider: FactoryProvider = {
 *   provide: ObjectStorage,
 *   useFactory: (config: Config) => {
 *     return new CustomObjectStorage(config.storage)
 *   },
 *   inject: [Config],
 * }
 */
const artifactProvider: FactoryProvider = {
  provide: ObjectStorage,
  useFactory: (config: Config) => {
    return config.s3.enable ? new S3ObjectStorage(config) : new LocalObjectStorage()
  },
  inject: [Config],
}

@Module({
  providers: [artifactProvider],
  exports: [artifactProvider],
})
export class StorageModule {}

export { ObjectStorage, ObjectStorage as JobLogStorage }
