export const errorHandler = (err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande', requestId: req.requestId })
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido', requestId: req.requestId })
  }

  // eslint-disable-next-line no-console
  console.error('Erro interno no servidor', err)
  return res.status(500).json({ error: 'Erro interno do servidor', requestId: req.requestId })
}
