import { Spinner } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'

import { ReportContentWithRoute } from './components/snapshot-detail-content'
import { SnapshotHeader } from './components/snapshot-header'
import { SnapshotModule } from './snapshot.module'

export const SnapshotDetail = () => {
  const routerParams = useParams<{ reportId: string }>()
  const reportId = parseInt(routerParams.reportId)

  const [state, dispatcher] = useModule(SnapshotModule)

  const snapshotReport = state.snapshotReports[reportId]

  const snapshotId = snapshotReport?.snapshot.id
  const title = snapshotReport?.snapshot.title ?? `Snapshot #${snapshotId}`

  useEffect(() => {
    dispatcher.fetchSnapshotReport(reportId)
  }, [dispatcher, reportId])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const onRenderHeader = useCallback(() => {
    if (!snapshotReport) {
      return null
    }

    return <SnapshotHeader snapshotTitle={title} report={snapshotReport} />
  }, [title, snapshotReport])

  if (state.reportLoading) {
    return <Spinner />
  }

  if (!snapshotReport) {
    return <div>Invalid report id</div>
  }

  return (
    <ContentCard onRenderHeader={onRenderHeader}>
      <ReportContentWithRoute snapshotReport={snapshotReport} />
    </ContentCard>
  )
}
