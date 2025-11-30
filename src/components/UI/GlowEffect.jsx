const GlowEffect = ({ 
  children, 
  color = 'cyan',
  intensity = 'normal',
  className = '' 
}) => {
  const colorClasses = {
    cyan: 'glow-cyan',
    blue: 'glow-blue',
    green: 'glow-green',
  }

  const intensityClasses = {
    light: 'opacity-50',
    normal: 'opacity-100',
    strong: 'opacity-100 animate-glow-pulse',
  }

  return (
    <div className={`${colorClasses[color]} ${intensityClasses[intensity]} ${className}`}>
      {children}
    </div>
  )
}

export default GlowEffect

