export const requireJsonContent = (req, res, next) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type deve ser application/json' })
  }

  return next()
}
