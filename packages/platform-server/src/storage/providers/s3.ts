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

import { createReadStream } from 'fs'
import { join } from 'path'
import { type Readable } from 'stream'

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import debugFactory from 'debug'

import { Config } from '@perfsee/platform-server/config'
import { PrettyBytes } from '@perfsee/shared'

import { BaseObjectStorage } from './provider'

const debug = debugFactory('perfsee:local-obj-storage')

const streamToBuffer = (stream?: Readable) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream?.on('data', (chunk: any) => chunks.push(chunk))
    stream?.once('end', () => resolve(Buffer.concat(chunks)))
    stream?.once('error', reject)
  })

export class ObjectStorage extends BaseObjectStorage {
  s3: S3Client
  basePath: string
  bucket: string
  constructor(globalConfig: Config) {
    super()
    this.basePath = ''
    this.s3 = new S3Client({
      region: globalConfig.s3.region,
      endpoint: globalConfig.s3.endpoint,
      credentials: {
        accessKeyId: globalConfig.s3.accessKeyId,
        secretAccessKey: globalConfig.s3.secretAccessKey,
      },
    })
    this.bucket = globalConfig.s3.bucket
  }

  async get(name: string): Promise<Buffer> {
    debug(`getting ${name} from s3 storage...`)
    const filePath = this.nameToPath(name)
    const response = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: filePath }))
    const stream = response.Body as Readable
    return streamToBuffer(stream)
  }

  async getStream(name: string): Promise<Readable> {
    debug(`getting ${name} stream from s3 storage...`)
    const filePath = this.nameToPath(name)
    const response = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: filePath }))
    const stream = response.Body as Readable
    return Promise.resolve(stream)
  }

  async upload(name: string, buf: Buffer) {
    debug(`uploading ${name} to s3 storage, file size: ${PrettyBytes.stringify(buf.byteLength)}`)
    const filePath = this.nameToPath(name)
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: filePath, Body: buf }))
  }

  async uploadFile(name: string, file: string) {
    debug(`uploading file ${name} to s3 storage...`)
    const filePath = this.nameToPath(name)
    const fileStream = createReadStream(file)
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: filePath, Body: fileStream }))
  }

  async delete(name: string) {
    debug(`deleting ${name} from s3 storage...`)
    const filePath = this.nameToPath(name)
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filePath }))
  }

  async deleteFolder(name: string) {
    const folderPath = this.nameToPath(name)
    debug(`deleting folder ${folderPath} from s3 storage...`)
    const list = await this.s3.send(new ListObjectsCommand({ Bucket: this.bucket, Prefix: folderPath }))
    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: list.Contents?.map((item) => ({ Key: item.Key })) || [],
        },
      }),
    )
  }

  private nameToPath(name: string) {
    if (typeof name !== 'string' || name.indexOf('..') !== -1) {
      throw new Error('Invalid storage key')
    }

    return join(this.basePath, name)
  }
}

export class LogObjectStorage extends ObjectStorage {}
