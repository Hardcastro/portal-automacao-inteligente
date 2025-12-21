export const mapBlogAutomationPayload = ({ correlationId, reports }) => ({
  correlationId,
  requestedAt: new Date().toISOString(),
  reports: Array.isArray(reports) ? reports : [],
})
