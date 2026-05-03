import confetti from 'canvas-confetti'

const COLORS = ['#34d399', '#fb7185', '#fbbf24', '#60a5fa', '#a78bfa']

export function pop(origin: { x: number; y: number }) {
  confetti({
    particleCount: 18,
    startVelocity: 22,
    spread: 60,
    ticks: 80,
    gravity: 1.2,
    decay: 0.92,
    scalar: 0.7,
    origin,
    colors: COLORS,
    disableForReducedMotion: true,
  })
}

export function celebrateAllDone() {
  const fire = (originX: number, particleCount: number) =>
    confetti({
      particleCount,
      startVelocity: 36,
      spread: 80,
      ticks: 200,
      gravity: 0.9,
      origin: { x: originX, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    })

  fire(0.2, 60)
  setTimeout(() => fire(0.5, 80), 120)
  setTimeout(() => fire(0.8, 60), 240)
}
