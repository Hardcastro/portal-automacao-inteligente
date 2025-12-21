export const createSqsAdapter = () => ({
  enqueue: async () => {
    throw new Error('SQS adapter not implemented')
  },
  process: () => {
    throw new Error('SQS adapter not implemented')
  },
})
