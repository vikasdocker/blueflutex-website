import { useState, useEffect, useRef } from "react"

export default function HamsterCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [frame, setFrame] = useState(0)
  const [vis, setVis] = useState(false)
  const target = useRef({ x: -100, y: -100 })
  const current = useRef({ x: -100, y: -100 })
  const raf = useRef(0)
  const lastT = useRef(0)
  const moving = useRef(false)
  const mt = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      if (!vis) setVis(true)
      moving.current = true
      mt.current = Date.now()
    }
    const onLeave = () => setVis(false)
    const onEnter = () => setVis(true)
    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
    }
  }, [vis])

  useEffect(() => {
    let lt = performance.now()
    const tick = (t: number) => {
      const dt = Math.min((t - lt) / 1000, 0.05)
      lt = t
      const lerp = 1 - Math.pow(0.00001, dt)
      current.current.x += (target.current.x - current.current.x) * lerp
      current.current.y += (target.current.y - current.current.y) * lerp
      setPos({ x: current.current.x, y: current.current.y })

      if (Date.now() - mt.current > 120) moving.current = false

      if (moving.current) {
        if (t - lastT.current > 100) {
          lastT.current = t
          setFrame((f) => (f + 1) % 6)
        }
      } else {
        setFrame(0)
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const dx = target.current.x - current.current.x
  const faceRight = dx >= 0

  const LF = [-14, -6, 10, 18, 10, -6]
  const LB = [10, 18, -14, -6, -14, -6]
  const RF = [14, -6, -10, 18, -14, -6]
  const RB = [-14, -6, 14, -6, 14, -6]
  const AF = [0, -4, 6, -10, 0, -4]
  const AB = [0, -4, -6, -10, 0, -4]
  const BY = [0, 1.5, -1, 2.5, 0, 1.5]

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 56,
        height: 56,
        pointerEvents: "none",
        zIndex: 99999,
        opacity: vis ? 1 : 0,
        transition: "opacity .2s",
        transform: `translate(-50%,-50%) scaleX(${faceRight ? 1 : -1})`,
        filter: "drop-shadow(0 2px 8px rgba(0,212,255,.4))",
        willChange: "transform,left,top",
      }}
    >
      <svg width="56" height="56" viewBox="-28 -28 56 56">
        <ellipse cx="0" cy={BY[frame]} rx="13" ry="10" fill="#F5C882" />
        <ellipse cx="0" cy={2 + BY[frame]} rx="8" ry="6" fill="#FFE4B5" />

        {/* Tail */}
        <path d={`M${-13} ${-2 + BY[frame]} Q${-20} ${-8 + BY[frame]} ${-16} ${-14 + BY[frame]}`} stroke="#D4A050" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Hind legs */}
        <line x1={-5} y1={7 + BY[frame]} x2={-5 + LB[frame]} y2={15 + LB[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="3" strokeLinecap="round" />
        <line x1={5} y1={7 + BY[frame]} x2={5 + RB[frame]} y2={15 + RB[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="3" strokeLinecap="round" />

        {/* Ear */}
        <ellipse cx={-7} cy={-10 + BY[frame]} rx="4" ry="5" fill="#F5C882" stroke="#D4A050" strokeWidth="0.8" />
        <ellipse cx={-7} cy={-10 + BY[frame]} rx="2.5" ry="3" fill="#FFB6C1" />

        {/* Head */}
        <circle cx={0} cy={-5 + BY[frame]} r="9" fill="#F5C882" />

        {/* Eye */}
        <circle cx={4} cy={-6 + BY[frame]} r="2.2" fill="#1a1a2e" />
        <circle cx={4.8} cy={-6.8 + BY[frame]} r="0.7" fill="#fff" />

        {/* Cheek */}
        <circle cx={6} cy={-2 + BY[frame]} r="2.8" fill="#FFB6C1" opacity="0.6" />

        {/* Nose */}
        <ellipse cx={8.5} cy={-4 + BY[frame]} rx="1.3" ry="1" fill="#D4A050" />

        {/* Mouth */}
        <path d={`M${7} ${-2.5 + BY[frame]} Q${9} ${-1 + BY[frame]} ${7.5} ${-0.5 + BY[frame]}`} stroke="#B8860B" strokeWidth="0.7" fill="none" />

        {/* Whiskers */}
        <line x1={7} y1={-4 + BY[frame]} x2={16} y2={-6 + BY[frame]} stroke="#D4A050" strokeWidth="0.5" />
        <line x1={7} y1={-2.5 + BY[frame]} x2={16} y2={-2.5 + BY[frame]} stroke="#D4A050" strokeWidth="0.5" />
        <line x1={7} y1={-1 + BY[frame]} x2={15} y2={1 + BY[frame]} stroke="#D4A050" strokeWidth="0.5" />

        {/* Front legs */}
        <line x1={5} y1={5 + BY[frame]} x2={5 + LF[frame]} y2={15 + LF[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="3" strokeLinecap="round" />
        <line x1={-5} y1={5 + BY[frame]} x2={-5 + RF[frame]} y2={15 + RF[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="3" strokeLinecap="round" />

        {/* Arms */}
        <line x1={6} y1={0 + BY[frame]} x2={6 + AF[frame]} y2={-3 + AF[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="2" strokeLinecap="round" />
        <line x1={-6} y1={0 + BY[frame]} x2={-6 + AB[frame]} y2={-3 + AB[frame + 1] + BY[frame]} stroke="#D4A050" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
