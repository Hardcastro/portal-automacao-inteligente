export const requestLogger = (logger = console) => (req, res, next) => {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    const path = req.originalUrl || req.url || req.path
    logger.info?.({
      message: 'http_request',
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      requestId: req.requestId,
    })
  })

  next()
}
