import { getSnapshotPaths, getStoreMeta } from '../../../../data/reportsData.js'

export const registerHealthRoutes = (app) => {
  app.get('/api/health', (req, res) => {
    const meta = getStoreMeta()
    const snapshots = getSnapshotPaths()

    return res.status(200).json({
      status: 'ok',
      meta,
      storage: {
        dataDir: snapshots.dataDir,
        publicDir: snapshots.publicDir,
        snapshotsEnabled: snapshots.snapshotsEnabled,
      },
      requestId: req.requestId,
    })
  })
}
