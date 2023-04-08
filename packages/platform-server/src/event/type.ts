import { BundleJobStatus, JobType, CreateJobEvent, SnapshotStatus, BundleJobUpdate } from '@perfsee/server-common'

import { Artifact, Project, Snapshot, SnapshotReport } from '../db'

type KnownEvent = 'job.create' | 'job.register_payload_getter' | 'maintenance.enter' | 'maintenance.leave'

export enum AnalyzeUpdateType {
  ArtifactUpdate = 'bundle_update',
  SnapshotUpdate = 'snapshot_update',
  SnapshotReportUpdate = 'snapshot_report_update',
  SourceUpdate = 'source_update',
}

type DynamicEvent =
  | JobType
  | `${JobType}.update`
  | `${JobType}.error`
  | `${JobType}.upload`
  | `${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus}`
  | `${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus}`
  | `${AnalyzeUpdateType.SnapshotReportUpdate}.${SnapshotStatus}`
  | `${AnalyzeUpdateType.SourceUpdate}.completed`

export type Event = DynamicEvent | KnownEvent

type KnownEventPayload =
  | {
      type: 'job.create'
      payload: [CreateJobEvent | CreateJobEvent[]]
    }
  | {
      type: 'job.register_payload_getter'
      payload: [JobType, (entityId: number, extra: { key: string }) => Promise<any>]
    }
  | {
      type: `${JobType}.error`
      payload: [number, string]
    }

export type BundleUpdatePayload = {
  project: Project
  artifact: Artifact
  bundleJobResult: BundleJobUpdate
  baselineArtifact: Artifact | undefined
}

export type SnapshotUpdatePayload = {
  project: Project
  snapshot: Snapshot
  reports: SnapshotReport[]
}

export type SnapshotReportUpdatePayload = {
  project: Project
  report: SnapshotReport
}

export type SourceUpdatePayload = {
  project: Project
  report: SnapshotReport
}

type DynamicEventPayload =
  | {
      type: `${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Pending}`
      payload: [Pick<BundleUpdatePayload, 'project' | 'artifact'>]
    }
  | {
      type: `${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Running}`
      payload: [BundleUpdatePayload]
    }
  | {
      type: `${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Passed}`
      payload: [BundleUpdatePayload]
    }
  | {
      type: `${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Failed}`
      payload: [BundleUpdatePayload]
    }
  | {
      type: `${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Pending}`
      payload: [Omit<SnapshotUpdatePayload, 'reports'>]
    }
  | {
      type: `${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Completed}`
      payload: [SnapshotUpdatePayload]
    }
  | {
      type: `${AnalyzeUpdateType.SnapshotReportUpdate}.${SnapshotStatus.Completed}`
      payload: [SnapshotReportUpdatePayload]
    }
  | {
      type: `${AnalyzeUpdateType.SourceUpdate}.completed`
      payload: [SourceUpdatePayload]
    }

type EventPayload = KnownEventPayload | DynamicEventPayload

export type ExtractPayload<T extends Event> = Extract<EventPayload, { type: T }>['payload'] extends never
  ? any[]
  : Extract<EventPayload, { type: T }>['payload']
