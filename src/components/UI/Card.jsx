import { motion } from 'framer-motion'

const Card = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  ...props 
}) => {
  const baseClasses = 'glass-effect rounded-xl p-6 depth-effect'
  const hoverClasses = hover ? 'card-hover cursor-pointer' : ''
  const glowClasses = glow ? 'glow-cyan' : ''
  
  const classes = `${baseClasses} ${hoverClasses} ${glowClasses} ${className}`

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card

