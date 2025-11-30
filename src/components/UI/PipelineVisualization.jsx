import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const PipelineVisualization = ({ steps = [] }) => {
  const defaultSteps = [
    { id: 1, label: 'Coleta', icon: '📥', color: 'cyan' },
    { id: 2, label: 'Processamento', icon: '⚙️', color: 'blue' },
    { id: 3, label: 'IA', icon: '🧠', color: 'cyan' },
    { id: 4, label: 'Execução', icon: '🚀', color: 'green' },
    { id: 5, label: 'Relatório', icon: '📊', color: 'blue' },
  ]

  const displaySteps = steps.length > 0 ? steps : defaultSteps

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 py-8">
      {displaySteps.map((step, index) => (
        <div key={step.id || index} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className={`
              glass-effect rounded-xl p-6 min-w-[120px] text-center
              border-2 ${
                step.color === 'cyan' ? 'border-cyan-luminous glow-cyan' :
                step.color === 'blue' ? 'border-electric-blue glow-blue' :
                'border-neon-green glow-green'
              }
              hover:scale-110 transition-transform duration-300
            `}>
              <div className="text-4xl mb-2">{step.icon}</div>
              <div className="text-sm font-semibold text-mist-gray">{step.label}</div>
            </div>
          </motion.div>
          
          {index < displaySteps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="mx-2 lg:mx-4"
            >
              <ArrowRight className="w-6 h-6 text-cyan-luminous" />
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PipelineVisualization

