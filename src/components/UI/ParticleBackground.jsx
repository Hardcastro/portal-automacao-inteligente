import { useEffect, useRef } from 'react'

const ParticleBackground = ({ particleCount = 50 }) => {
  const canvasRef = useRef(null)
  const mouseRef = useRef(null)
  const scrollRef = useRef(0)
  const sizeRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      sizeRef.current = { width, height }
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()

    const particles = []
    const colors = ['#00E5FF', '#1E90FF', '#7CFFB2']
    let animationFrameId

    class Particle {
      constructor() {
        this.x = Math.random() * sizeRef.current.width
        this.y = Math.random() * sizeRef.current.height
        this.size = Math.random() * 2 + 0.5
        this.baseSpeedX = Math.random() * 0.5 - 0.25
        this.baseSpeedY = Math.random() * 0.5 - 0.25
        this.speedX = this.baseSpeedX
        this.speedY = this.baseSpeedY
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        const { width, height } = sizeRef.current
        const hasMouse = Boolean(mouseRef.current)
        const dx = hasMouse ? mouseRef.current.x - this.x : 0
        const dy = hasMouse ? mouseRef.current.y - this.y : 0
        const distance = hasMouse ? Math.sqrt(dx * dx + dy * dy) || 1 : 1

        const mouseInfluence = hasMouse ? Math.max(1 - distance / 250, 0) : 0
        const scrollInfluence = Math.min(scrollRef.current / 600, 0.35)

        this.speedX = this.baseSpeedX + (dx / distance) * mouseInfluence * 1.2
        this.speedY = this.baseSpeedY + (dy / distance) * mouseInfluence * 1.2

        this.x += this.speedX
        this.y += this.speedY

        this.opacity = Math.min(1, 0.25 + mouseInfluence * 0.5 + scrollInfluence)

        if (this.x > width) this.x = 0
        if (this.x < 0) this.x = width
        if (this.y > height) this.y = 0
        if (this.y < 0) this.y = height
      }

      draw() {
        ctx.fillStyle = this.color
        ctx.globalAlpha = this.opacity
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const animate = () => {
      const { width, height } = sizeRef.current
      ctx.clearRect(0, 0, width, height)

      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.strokeStyle = particle.color
            ctx.globalAlpha = ((150 - distance) / 150) * 0.25
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        })
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      resizeCanvas()
    }

    const handleMouseMove = (event) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = null
    }

    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [particleCount])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.35 }}
    />
  )
}

export default ParticleBackground

