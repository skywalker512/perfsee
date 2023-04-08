import { Test } from '@nestjs/testing'

import test, { createMock } from '@perfsee/platform-server/test'
import { SourceStatus } from '@perfsee/server-common'

import { SourceController } from '../controller'
import { SourceService } from '../service'

type AnalyzeResult = Parameters<SourceController['onReceiveAnalyzeResult']>['0']

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    controllers: [SourceController],
  })
    .useMocker(createMock)
    .compile()
})

test('items have coverage report', async (t) => {
  const service = t.context.module.get(SourceService)
  const controller = t.context.module.get(SourceController)

  const analyzeResult = createMock<AnalyzeResult>({
    projectId: 1,
    reportId: 1,
    sourceCoverageStorageKey: 'StorageKey',
    status: SourceStatus.Completed,
  })
  await controller.onReceiveAnalyzeResult(analyzeResult)

  t.true(service.completeSource.calledOnce)
})

test('update source upload file size', async (t) => {
  const service = t.context.module.get(SourceService)
  const controller = t.context.module.get(SourceController)

  await controller.handleSourceUploadSize(1, 1)

  t.truthy(service.handleJobUpload.calledWith(1, 1))
})
