import { useEffect, useRef } from 'react'

interface Square {
  x: number
  y: number
  life: number
  maxLife: number
  active: boolean
  draw(): void
}

class AnimatedSquare implements Square {
  x: number
  y: number
  life: number
  maxLife: number
  active: boolean
  private ctx: CanvasRenderingContext2D
  private gridSize: number

  constructor(canvasWidth: number, canvasHeight: number, ctx: CanvasRenderingContext2D, gridSize: number) {
    this.ctx = ctx
    this.gridSize = gridSize
    this.x = Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize
    this.y = Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize
    this.life = 0
    this.maxLife = Math.random() * 100 + 50
    this.active = true
  }

  draw() {
    this.life++
    if (this.life > this.maxLife) this.active = false
    const opacity = Math.sin((this.life / this.maxLife) * Math.PI) * 0.12
    this.ctx.fillStyle = `rgba(41, 37, 36, ${opacity})` // stone-800
    this.ctx.fillRect(this.x, this.y, this.gridSize, this.gridSize)
  }
}

export function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const squaresRef = useRef<Square[]>([])
  const animationIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gridSize = 40
    let width: number, height: number

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      // Clear squares on resize to prevent positioning issues
      squaresRef.current = []
    }

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.lineWidth = 1
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      drawGrid()
      if (Math.random() < 0.25) squaresRef.current.push(new AnimatedSquare(width, height, ctx, gridSize))
      squaresRef.current = squaresRef.current.filter(s => s.active)
      squaresRef.current.forEach(s => s.draw())
      animationIdRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => resize()
    window.addEventListener('resize', handleResize)
    
    resize()
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
      style={{ zIndex: -1 }}
    />
  )
}