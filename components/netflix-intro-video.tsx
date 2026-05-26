'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import { Volume2, VolumeX } from 'lucide-react'

const SOUND_UNLOCK_KEY = 'netflix-intro-sound-unlocked'

type Props = {
  className?: string
  loop?: boolean
  withSound?: boolean
}

export function NetflixIntroVideo({
  className = '',
  loop = true,
  withSound = true,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const unlockedRef = useRef(false)
  const [isMuted, setIsMuted] = useState(true)

  const playWithSound = useCallback(async () => {
    const v = ref.current
    if (!v || !withSound || unlockedRef.current) return false

    v.muted = false
    v.volume = 1
    try {
      await v.play()
      unlockedRef.current = true
      setIsMuted(false)
      sessionStorage.setItem(SOUND_UNLOCK_KEY, '1')
      return true
    } catch {
      return false
    }
  }, [withSound])

  const playMuted = useCallback(async () => {
    const v = ref.current
    if (!v) return
    v.muted = true
    setIsMuted(true)
    await v.play().catch(() => {})
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v || !withSound) {
      playMuted()
      return
    }

    const init = async () => {
      // Đã từng tương tác trong phiên → thử phát có tiếng ngay
      if (sessionStorage.getItem(SOUND_UNLOCK_KEY)) {
        const ok = await playWithSound()
        if (ok) return
      }

      // Thử autoplay có tiếng (một số trình duyệt cho phép)
      const ok = await playWithSound()
      if (ok) return

      // Fallback: phát im lặng, bật tiếng ngay khi user click/chạm bất kỳ đâu
      await playMuted()
    }

    init()

    const unlockOnGesture = () => {
      if (unlockedRef.current) return
      playWithSound()
    }

    const events = ['click', 'touchstart', 'keydown', 'pointerdown'] as const
    events.forEach((e) => {
      document.addEventListener(e, unlockOnGesture, { capture: true, passive: true })
    })

    return () => {
      events.forEach((e) => {
        document.removeEventListener(e, unlockOnGesture, { capture: true })
      })
    }
  }, [withSound, playWithSound, playMuted])

  const toggleMute = () => {
    const v = ref.current
    if (!v) return
    if (v.muted) {
      v.muted = false
      v.volume = 1
      unlockedRef.current = true
      setIsMuted(false)
      sessionStorage.setItem(SOUND_UNLOCK_KEY, '1')
      v.play().catch(() => {})
    } else {
      v.muted = true
      setIsMuted(true)
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-lg bg-black group ${className}`}
      onPointerEnter={() => playWithSound()}
      onPointerDown={() => playWithSound()}
    >
      <Image
        src="/images/maintheme.png"
        alt=""
        fill
        className="object-cover opacity-40"
        sizes="(max-width: 768px) 100vw, 400px"
        priority
      />

      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover z-[1]"
        autoPlay
        loop={loop}
        playsInline
        preload="auto"
        poster="/images/maintheme.png"
      >
        <source src="/videos/netflix-intro.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-[2] pointer-events-none" />

      {withSound && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
          className="absolute bottom-3 right-3 z-[3] p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          aria-label="Toggle sound"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </div>
  )
}
