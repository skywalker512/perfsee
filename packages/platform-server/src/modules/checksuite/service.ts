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

import { Injectable } from '@nestjs/common'

import { OnEvent } from '@perfsee/platform-server/event'
import { AnalyzeUpdateType, BundleUpdatePayload, SnapshotUpdatePayload } from '@perfsee/platform-server/event/type'
import { UrlService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { BundleJobStatus, SnapshotStatus } from '@perfsee/server-common'
import { GitHost } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { GithubCheckSuiteProvider } from './providers/github'
import { CheckAction, CheckConclusion, CheckStatus, CheckType } from './types'

@Injectable()
export class CheckSuiteService {
  constructor(
    private readonly githubProvider: GithubCheckSuiteProvider,
    private readonly logger: Logger,
    private readonly url: UrlService,
  ) {}

  @OnEvent(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Pending}`)
  async startBundleCheck({ project, artifact }: Pick<BundleUpdatePayload, 'project' | 'artifact'>) {
    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.queued,
      startedAt: new Date(),
      type: CheckType.Bundle,
      artifact,
      detailsUrl: this.url.platformUrl(pathFactory.project.bundle.home, {
        projectId: project.slug,
      }),
    })
  }

  @OnEvent(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Running}`)
  async runBundleCheck(payload: BundleUpdatePayload) {
    const { project, artifact } = payload

    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.inProgress,
      type: CheckType.Bundle,
      artifact,
      detailsUrl: this.url.platformUrl(pathFactory.project.bundle.home, {
        projectId: project.slug,
      }),
    })
  }

  @OnEvent(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Passed}`)
  async bundlePassedCheck(payload: BundleUpdatePayload) {
    await this.endBundleCheck(payload)
  }

  @OnEvent(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Failed}`)
  async bundleFailedCheck(payload: BundleUpdatePayload) {
    await this.endBundleCheck(payload)
  }

  async endBundleCheck(payload: BundleUpdatePayload) {
    const { project, artifact, bundleJobResult, baselineArtifact } = payload

    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.completed,
      conclusion: artifact.succeeded() ? CheckConclusion.Success : CheckConclusion.Failure,
      completedAt: new Date(),
      type: CheckType.Bundle,
      detailsUrl: this.url.platformUrl(pathFactory.project.bundle.detail, {
        projectId: project.slug,
        bundleId: artifact.iid,
      }),
      artifact,
      baselineArtifact,
      bundleJobResult,
    })
  }

  @OnEvent(`${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Pending}`)
  async startLabCheck({ project, snapshot }: Omit<SnapshotUpdatePayload, 'reports'>) {
    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.queued,
      type: CheckType.Lab,
      snapshot,
    })
  }

  @OnEvent(`${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Running}`)
  async runLabCheck(payload: SnapshotUpdatePayload) {
    const { snapshot, project } = payload

    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.inProgress,
      type: CheckType.Lab,
      snapshot,
    })
  }

  @OnEvent(`${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Completed}`)
  async endLabCheck(payload: SnapshotUpdatePayload) {
    const { project, snapshot, reports } = payload
    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.completed,
      type: CheckType.Lab,
      reports,
      snapshot,
      conclusion: CheckConclusion.Success,
    })
  }

  async createOrUpdateCheck(action: CheckAction) {
    try {
      this.logger.verbose(`Creating or updating check type: ${action.type}, status: ${action.status}.`)
      if (action.project.host === GitHost.Github) {
        await this.githubProvider.createOrUpdateCheck(action)
      }
    } catch (e) {
      this.logger.error(`Create or update check error ${e instanceof Error ? e.stack : e}`)
    }
  }
}
