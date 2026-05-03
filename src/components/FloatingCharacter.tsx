import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../db/schema'
import { characterFromTotal, type CharacterState } from '../lib/character'
import { Character } from './Character'

const SIZE = 64

export function FloatingCharacter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [character, setCharacter] = useState<CharacterState>(() => characterFromTotal(0))
  const [jumping, setJumping] = useState(false)
  const [sparkleKey, setSparkleKey] = useState(0)

  useEffect(() => {
    const update = () => setW(containerRef.current?.clientWidth ?? 0)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const refresh = () => {
      db.logs.count().then((n) => setCharacter(characterFromTotal(n)))
    }
    refresh()
    const onTaken = () => {
      refresh()
      setJumping(true)
      setSparkleKey((k) => k + 1)
      window.setTimeout(() => setJumping(false), 700)
    }
    window.addEventListener('dose-taken', onTaken as EventListener)
    return () => window.removeEventListener('dose-taken', onTaken as EventListener)
  }, [])

  const open = () => window.dispatchEvent(new CustomEvent('open-journey'))

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute bottom-20 inset-x-0 z-10 h-16"
    >
      {w > SIZE + 8 && (
        <motion.div
          animate={{ x: [8, w - SIZE - 8, 8] }}
          transition={{
            duration: 48,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute"
          style={{ width: SIZE, height: SIZE }}
        >
          <motion.button
            type="button"
            onClick={open}
            animate={
              jumping
                ? { y: [0, -22, 0] }
                : { y: [0, -2, 0] }
            }
            transition={
              jumping
                ? { duration: 0.7, ease: 'easeOut' }
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
            }
            className="pointer-events-auto block rounded-full focus:outline-none"
            aria-label="あなたのあゆみを見る"
          >
            <Character stage={character.stage.stage} size={SIZE} bobbing={false} />
          </motion.button>

          <AnimatePresence>
            {jumping && (
              <motion.span
                key={sparkleKey}
                initial={{ opacity: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: 1, y: -22, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.55 }}
                className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-xl text-amber-400"
              >
                ✦
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
