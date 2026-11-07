import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

const PAL = ['#e8316b', '#ffb02e', '#ff7a1a', '#9b5de5', '#19c3b1']
const TAU = Math.PI * 2
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const tex = (n, draw) => {
  const c = document.createElement('canvas'); c.width = c.height = n
  draw(c.getContext('2d'), n)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
const glowTex = () => tex(128, (x, n) => {
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, '#fff0c8'); g.addColorStop(0.25, 'rgba(255,160,50,.55)'); g.addColorStop(1, 'rgba(255,90,0,0)')
  x.fillStyle = g; x.fillRect(0, 0, n, n)
})
const rangoliTex = () => tex(512, (x) => {
  x.translate(256, 256)
  for (let r = 0; r < 4; r++) {
    const n = 8 + r * 4, d = 62 + r * 48, h = 22 + r * 5
    for (let i = 0; i < n; i++) {
      x.save(); x.rotate((i / n) * TAU); x.translate(0, -d)
      x.fillStyle = PAL[(i + r) % 5]; x.beginPath(); x.ellipse(0, 0, 9 + r * 3, h, 0, 0, TAU); x.fill()
      x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(0, -h - 8, 3, 0, TAU); x.fill(); x.restore()
    }
  }
  x.fillStyle = '#ffb02e'; x.beginPath(); x.arc(0, 0, 34, 0, TAU); x.fill()
})
const PROFILE = [[0, 0], [0.55, 0], [0.85, 0.1], [1.3, 0.42], [1.62, 0.88], [1.5, 0.93], [1.15, 0.64], [0.7, 0.5], [0, 0.46]]
const FN = 1400

export default function Scene({ lit, onLight }) {
  const glow = useMemo(glowTex, []), rang = useMemo(rangoliTex, [])
  const prof = useMemo(() => PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), [])
  const S = useRef({ k: 0, at: 0, next: 0, tilt: null }).current
  const D = useMemo(() => ({ p: new Float32Array(FN * 3), c: new Float32Array(FN * 3), b: new Float32Array(FN * 3), v: new Float32Array(FN * 3), l: new Float32Array(FN), i: 0 }), [])
  const halo = useRef(), flame = useRef(), core = useRef(), oil = useRef(), rgm = useRef(), light = useRef()
  const spin = useRef(), rg = useRef(), geo = useRef(), ring = useRef([])

  useEffect(() => {
    const o = (e) => { if (e.gamma != null) S.tilt = [cl(e.gamma / 30, -1, 1), cl((45 - e.beta) / 30, -1, 1)] }
    addEventListener('deviceorientation', o)
    return () => removeEventListener('deviceorientation', o)
  }, [S])

  const burst = (x, y, z) => {
    const col = new THREE.Color(PAL[(Math.random() * 5) | 0])
    for (let q = 0; q < 110; q++) {
      const i = D.i++ % FN, j = i * 3, a = Math.random() * TAU, b = Math.acos(2 * Math.random() - 1), s = 2 + Math.random() * 2.2
      D.p.set([x, y, z], j); D.b.set([col.r, col.g, col.b], j); D.l[i] = 1
      D.v.set([s * Math.sin(b) * Math.cos(a), s * Math.sin(b) * Math.sin(a), s * Math.cos(b)], j)
    }
  }

  useFrame(({ clock, camera, size, pointer }, dt) => {
    dt = Math.min(dt, 0.05)
    const t = clock.elapsedTime
    S.k += ((lit ? 1 : 0) - S.k) * Math.min(1, dt * 1.6)
    const k = S.k
    if (lit && !S.at) S.at = t
    const f = 1 + Math.sin(t * 13) * 0.06 + Math.sin(t * 23.7) * 0.05 + Math.sin(t * 5.1) * 0.04

    flame.current.scale.set(0.85 * k, 1.5 * k * f, 1); flame.current.position.y = 0.95 + 0.3 * k * f
    core.current.scale.set(0.3 * k, 0.55 * k * f, 1); core.current.position.y = 0.98 + 0.12 * k
    halo.current.scale.setScalar(4.5 * k * (0.95 + 0.05 * f)); halo.current.material.opacity = 0.5 * k * f
    light.current.intensity = 60 * k * f
    oil.current.emissiveIntensity = k * 0.9
    rgm.current.emissiveIntensity = 0.07 + 0.2 * k
    if (!RM) { rg.current.rotation.z = t * 0.06; spin.current.rotation.y = t * 0.2 }

    const lt = S.at ? t - S.at : 0 // ring of little lights wakes up one by one
    ring.current.forEach((m, i) => (m.material.opacity = cl(lt - i * 0.15) * (0.75 + 0.25 * Math.sin(t * 6 + i * 2))))

    const [px, py] = S.tilt || [pointer.x, pointer.y]
    camera.position.x += (px * 1.6 + (RM ? 0 : Math.sin(t * 0.25) * 0.7) - camera.position.x) * 0.04
    camera.position.y += (3.4 + py * 0.8 - camera.position.y) * 0.04
    camera.position.z = (size.width < size.height ? 11 : 8) + (1 - k) * 1.5
    camera.lookAt(0, 0.9, 0)

    if (lit && !RM && t > S.next) {
      S.next = t + 0.9 + Math.random() * 1.3
      burst((Math.random() - 0.5) * Math.min(8, (size.width / size.height) * 9), 2 + Math.random() * 3, -2 - Math.random() * 3)
    }
    for (let i = 0; i < FN; i++) {
      if (D.l[i] <= 0) continue
      const j = i * 3; D.l[i] -= dt * 0.5; D.v[j + 1] -= 2.4 * dt
      for (let a = 0; a < 3; a++) { D.v[j + a] *= 0.985; D.p[j + a] += D.v[j + a] * dt; D.c[j + a] = D.b[j + a] * Math.max(D.l[i], 0) ** 2 }
    }
    geo.current.attributes.position.needsUpdate = geo.current.attributes.color.needsUpdate = true
  })

  const additive = { map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }
  return (
    <>
      <color attach="background" args={['#16060f']} />
      <ambientLight intensity={0.55} color="#b07090" />
      <directionalLight position={[-4, 5, -4]} intensity={0.35} color="#6a4aff" />
      <pointLight ref={light} position={[0, 1.5, 0]} color="#ff9040" distance={18} intensity={0} />

      {/* rangoli floor */}
      <mesh ref={rg} rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[11, 11]} />
        <meshStandardMaterial ref={rgm} map={rang} emissiveMap={rang} emissive="#ffffff" emissiveIntensity={0.07} transparent roughness={1} />
      </mesh>

      {/* the diya */}
      <group ref={spin}>
        <mesh><latheGeometry args={[prof, 56]} /><meshStandardMaterial color="#d2691e" metalness={0.45} roughness={0.4} emissive="#2a0c02" side={THREE.DoubleSide} /></mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.55}><circleGeometry args={[0.88, 32]} /><meshStandardMaterial ref={oil} color="#2a1000" emissive="#ff6a00" emissiveIntensity={0} roughness={0.15} /></mesh>
        <mesh position-y={0.74}><cylinderGeometry args={[0.045, 0.06, 0.4]} /><meshStandardMaterial color="#1a0d08" /></mesh>
      </group>
      <sprite ref={halo} position={[0, 1.3, 0]}><spriteMaterial {...additive} color="#ff8a2a" /></sprite>
      <sprite ref={flame}><spriteMaterial {...additive} color="#ffa030" /></sprite>
      <sprite ref={core}><spriteMaterial {...additive} color="#fff2c0" /></sprite>

      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * TAU
        return <sprite key={i} ref={(el) => (ring.current[i] = el)} position={[Math.cos(a) * 4.9, 0.25, Math.sin(a) * 4.9]} scale={0.7}><spriteMaterial {...additive} color="#ffc060" opacity={0} /></sprite>
      })}

      <Sparkles count={140} scale={[16, 8, 10]} position={[0, 4, -1]} size={6} speed={0.5} color="#ffa640" />

      {/* fireworks */}
      <points frustumCulled={false}>
        <bufferGeometry ref={geo}>
          <bufferAttribute attach="attributes-position" args={[D.p, 3]} />
          <bufferAttribute attach="attributes-color" args={[D.c, 3]} />
        </bufferGeometry>
        <pointsMaterial map={glow} size={0.3} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      {/* invisible backdrop: first tap lights the diya, later taps launch fireworks */}
      <mesh position={[0, 3, -6]} onPointerDown={(e) => { if (!lit) return onLight(); burst(e.point.x, Math.max(e.point.y, 2), e.point.z) }}>
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.5} luminanceSmoothing={0.2} />
        <Vignette offset={0.25} darkness={0.8} />
      </EffectComposer>
    </>
  )
}
