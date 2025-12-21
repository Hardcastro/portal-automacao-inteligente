export const buildListEtag = (meta = {}) => `W/"reports:${meta.total ?? 0}:${meta.lastUpdated || 'unknown'}"`

export const buildReportEtag = ({ slug, date }) => `W/"report:${slug}:${date || 'unknown'}"`
