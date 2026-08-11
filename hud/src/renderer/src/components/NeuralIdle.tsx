import { useEffect, useRef } from 'react'
import type { DepartmentSnapshot } from '../../../shared/types'

// True "millions" of primitives isn't renderable at interactive frame rates in a
// 2D canvas — this is the densest node/edge mesh that still holds 60fps, sized
// so it *reads* as a massive neural mesh rather than a geometric wireframe.
//
// Four concentric shells, innermost (the "core") to outermost. The core is the
// densest and most tightly-connected — every other shell's inward-facing nodes
// bridge to their nearest neighbor one shell in, so the whole structure reads as
// radiating outward from the core rather than four independent spheres.
interface LayerConfig {
  radiusFactor: number
  nodeCount: number
  neighbors: number
  intensity: number // brightness multiplier — kept high and flat across shells so outer layers stay clearly visible
  color: string // "r, g, b" — each shell is a distinct cosmic body, not one hue at fading alpha
}

// Core -> outer reads as a deep-space photo composite: a nebula at the center,
// then a warm star cluster, a red giant shell, a blue shell, and a green outer shell at the edge.
const LAYERS: LayerConfig[] = [
  { radiusFactor: 0.32, nodeCount: 520, neighbors: 4, intensity: 1.0, color: '224, 90, 255' }, // nebula core
  { radiusFactor: 0.62, nodeCount: 380, neighbors: 3, intensity: 1.0, color: '255, 196, 92' }, // star cluster
  { radiusFactor: 1.0, nodeCount: 450, neighbors: 3, intensity: 1.0, color: '255, 82, 76' }, // red giants — the original shell
  { radiusFactor: 1.17, nodeCount: 320, neighbors: 3, intensity: 1.0, color: '70, 150, 255' }, // blue shell
  { radiusFactor: 1.35, nodeCount: 260, neighbors: 2, intensity: 1.0, color: '90, 255, 130' } // outer shell
]
const LONG_RANGE_EDGES = 30
const RADIUS_JITTER = 0.1 // shell thickness as a fraction of each layer's own radius

const ROT_Y_PERIOD_S = 42 // one slow full spin
const WOBBLE_X_PERIOD_S = 17.3 // irrational-ish ratio vs. Y period so it never repeats visibly
const WOBBLE_X_AMPLITUDE = 0.22
const BREATH_PERIOD_S = 4.4
const SPARK_COUNT = 16
const SPARK_TRAIL_STEPS = 5
const SPARK_DURATION_MS = 700
const CORE_HOT = '255, 235, 250' // near-white, the hottest point of the nebula gradient

const ACTIVE_GLOW_BOOST = 0.22
const FLASH_DURATION_MS = 900
const FLASH_BOOST = 0.85
const WAVE_SWEEP_PERIOD_S = 1.1
const WAVE_SIGMA = 0.1
const WAVE_BOOST = 0.85
// Amplitude arrives as discrete samples (~30/s from real voice/ playback, or
// once per React re-render for speak-test) — smooth it frame-to-frame so the
// wave doesn't visibly step between updates.
const AMPLITUDE_SMOOTHING = 0.3

interface Vec3 {
  x: number
  y: number
  z: number
}

interface Edge {
  a: number
  b: number
  kind: 'intra' | 'bridge' | 'long-range'
}

interface Spark {
  edgeIndex: number
  start: number
  duration: number
}

interface NeuralIdleProps {
  departments: DepartmentSnapshot[]
  flash: { departmentId: string; start: number } | null
  speaking: boolean
  amplitude: number
}

function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c }
}

function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c }
}

function dist2(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return dx * dx + dy * dy + dz * dz
}

function parseRgb(s: string): [number, number, number] {
  const parts = s.split(',').map((n) => parseFloat(n))
  return [parts[0], parts[1], parts[2]]
}

/** Cross-layer edges blend the two cosmic bodies they connect rather than picking one. */
function blendRgb(a: string, b: string): string {
  const [ar, ag, ab] = parseRgb(a)
  const [br, bg, bb] = parseRgb(b)
  return `${(ar + br) / 2}, ${(ag + bg) / 2}, ${(ab + bb) / 2}`
}

function lightenRgb(s: string, amount: number): string {
  const [r, g, b] = parseRgb(s)
  return `${r + (255 - r) * amount}, ${g + (255 - g) * amount}, ${b + (255 - b) * amount}`
}

/** Deterministic near-uniform point on a unit sphere — used both for node distribution and department zone anchors. */
function fibonacciPoint(i: number, total: number): Vec3 {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (i / Math.max(1, total - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = goldenAngle * i
  return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r }
}

function makeLayerNodes(config: LayerConfig): Vec3[] {
  const nodes: Vec3[] = []
  for (let i = 0; i < config.nodeCount; i++) {
    const base = fibonacciPoint(i, config.nodeCount)
    const jitter = 1 + (Math.random() - 0.5) * RADIUS_JITTER
    nodes.push({
      x: base.x * jitter * config.radiusFactor,
      y: base.y * jitter * config.radiusFactor,
      z: base.z * jitter * config.radiusFactor
    })
  }
  return nodes
}

function nearestNeighborEdges(
  nodes: Vec3[],
  offset: number,
  k: number,
  edgeKeys: Set<string>,
  edges: Edge[]
): void {
  for (let i = 0; i < nodes.length; i++) {
    const best: { j: number; d2: number }[] = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const d2 = dist2(nodes[i], nodes[j])
      if (best.length < k) {
        best.push({ j, d2 })
        best.sort((a, b) => a.d2 - b.d2)
      } else if (d2 < best[best.length - 1].d2) {
        best[best.length - 1] = { j, d2 }
        best.sort((a, b) => a.d2 - b.d2)
      }
    }
    for (const { j } of best) {
      const gi = offset + i
      const gj = offset + j
      const key = gi < gj ? `${gi}-${gj}` : `${gj}-${gi}`
      if (edgeKeys.has(key)) continue
      edgeKeys.add(key)
      edges.push({ a: gi, b: gj, kind: 'intra' })
    }
  }
}

/** Bridges every node in the inner layer to its nearest node in the next layer out — the "emerges from the core" radial connections. */
function bridgeEdges(
  innerNodes: Vec3[],
  innerOffset: number,
  outerNodes: Vec3[],
  outerOffset: number,
  edges: Edge[]
): void {
  for (let i = 0; i < innerNodes.length; i++) {
    let bestJ = -1
    let bestD2 = Infinity
    for (let j = 0; j < outerNodes.length; j++) {
      const d2 = dist2(innerNodes[i], outerNodes[j])
      if (d2 < bestD2) {
        bestD2 = d2
        bestJ = j
      }
    }
    edges.push({ a: innerOffset + i, b: outerOffset + bestJ, kind: 'bridge' })
  }
}

function buildMesh(): {
  nodes: Vec3[]
  edges: Edge[]
  edgeColors: string[]
  intensity: number[]
  colors: string[]
  radialDist: number[]
} {
  const nodes: Vec3[] = []
  const intensity: number[] = []
  const colors: string[] = []
  const layerNodeSets: Vec3[][] = []
  const layerOffsets: number[] = []

  for (const layer of LAYERS) {
    layerOffsets.push(nodes.length)
    const layerNodes = makeLayerNodes(layer)
    layerNodeSets.push(layerNodes)
    for (const n of layerNodes) {
      nodes.push(n)
      intensity.push(layer.intensity)
      colors.push(layer.color)
    }
  }

  const edgeKeys = new Set<string>()
  const edges: Edge[] = []

  layerNodeSets.forEach((layerNodes, i) => {
    nearestNeighborEdges(layerNodes, layerOffsets[i], LAYERS[i].neighbors, edgeKeys, edges)
  })

  for (let i = 0; i < layerNodeSets.length - 1; i++) {
    bridgeEdges(layerNodeSets[i], layerOffsets[i], layerNodeSets[i + 1], layerOffsets[i + 1], edges)
  }

  for (let i = 0; i < LONG_RANGE_EDGES; i++) {
    const a = Math.floor(Math.random() * nodes.length)
    const b = Math.floor(Math.random() * nodes.length)
    if (a === b) continue
    edges.push({ a, b, kind: 'long-range' })
  }

  const edgeColors = edges.map((e) => blendRgb(colors[e.a], colors[e.b]))
  const radialDist = nodes.map((n) => Math.hypot(n.x, n.y, n.z))

  return { nodes, edges, edgeColors, intensity, colors, radialDist }
}

export default function NeuralIdle({
  departments,
  flash,
  speaking,
  amplitude
}: NeuralIdleProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const departmentsRef = useRef(departments)
  const flashRef = useRef(flash)
  const speakingRef = useRef(speaking)
  const speakingStartRef = useRef<number | null>(null)
  const amplitudeRef = useRef(amplitude)

  useEffect(() => {
    departmentsRef.current = departments
  }, [departments])

  useEffect(() => {
    flashRef.current = flash
  }, [flash])

  useEffect(() => {
    speakingRef.current = speaking
    if (speaking) speakingStartRef.current = performance.now()
  }, [speaking])

  useEffect(() => {
    amplitudeRef.current = amplitude
  }, [amplitude])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let radius = 0
    const { nodes, edges, edgeColors, intensity, colors, radialDist } = buildMesh()
    const nodeExtraAlpha = new Float32Array(nodes.length)
    let nodeZone: number[] = []
    let zoneOfDeptId = new Map<string, number>()
    let activeZones = new Set<number>()
    let lastDeptCount = 0
    let smoothedAmplitude = 0
    const maxRadius = LAYERS[LAYERS.length - 1].radiusFactor * 1.05

    const sparks: Spark[] = Array.from({ length: SPARK_COUNT }, (_, i) => ({
      edgeIndex: Math.floor(Math.random() * edges.length),
      start: performance.now() - (i * SPARK_DURATION_MS) / SPARK_COUNT,
      duration: SPARK_DURATION_MS * (0.7 + Math.random() * 0.6)
    }))
    let rafId = 0

    function resize(): void {
      const dpr = window.devicePixelRatio || 1
      width = container!.clientWidth
      height = container!.clientHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width, height) * 0.34
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    function maybeRebuildZones(): void {
      const depts = departmentsRef.current
      if (depts.length === 0 || depts.length === lastDeptCount) return
      lastDeptCount = depts.length

      const anchors = depts.map((_, i) => fibonacciPoint(i, depts.length))
      zoneOfDeptId = new Map(depts.map((d, i) => [d.id, i]))
      nodeZone = nodes.map((n) => {
        const mag = Math.hypot(n.x, n.y, n.z) || 1
        const ux = n.x / mag
        const uy = n.y / mag
        const uz = n.z / mag
        let best = 0
        let bestDot = -Infinity
        anchors.forEach((a, idx) => {
          const dot = ux * a.x + uy * a.y + uz * a.z
          if (dot > bestDot) {
            bestDot = dot
            best = idx
          }
        })
        return best
      })
      activeZones = new Set(
        depts.reduce<number[]>((acc, d, idx) => {
          if (d.recentActivity.length > 0) acc.push(idx)
          return acc
        }, [])
      )
    }

    function step(now: number): void {
      const t = now / 1000
      const rotY = (t * 2 * Math.PI) / ROT_Y_PERIOD_S
      const rotX = WOBBLE_X_AMPLITUDE * Math.sin((t * 2 * Math.PI) / WOBBLE_X_PERIOD_S)
      const breath = 0.78 + 0.22 * Math.sin((t * 2 * Math.PI) / BREATH_PERIOD_S)

      maybeRebuildZones()

      const flashNow = flashRef.current
      let flashZone = -1
      let flashAmount = 0
      if (flashNow) {
        const elapsed = now - flashNow.start
        if (elapsed >= 0 && elapsed < FLASH_DURATION_MS) {
          flashZone = zoneOfDeptId.get(flashNow.departmentId) ?? -1
          flashAmount = (1 - elapsed / FLASH_DURATION_MS) * FLASH_BOOST
        }
      }

      smoothedAmplitude += (amplitudeRef.current - smoothedAmplitude) * AMPLITUDE_SMOOTHING

      let waveRadius = -1
      let waveEnvelope = 0
      if (speakingRef.current && speakingStartRef.current !== null) {
        const elapsedS = (now - speakingStartRef.current) / 1000
        const sweepT = (elapsedS % WAVE_SWEEP_PERIOD_S) / WAVE_SWEEP_PERIOD_S
        waveRadius = sweepT * maxRadius
        waveEnvelope = smoothedAmplitude
      }

      const projected = nodes.map((p) => {
        const rx = rotateX(p, rotX)
        const world = rotateY(rx, rotY)
        return { x: width / 2 + world.x * radius, y: height / 2 + world.y * radius, z: world.z }
      })

      for (let i = 0; i < nodes.length; i++) {
        let extra = 0
        if (nodeZone[i] !== undefined && activeZones.has(nodeZone[i])) {
          extra += ACTIVE_GLOW_BOOST
        }
        if (flashZone >= 0 && nodeZone[i] === flashZone) {
          extra += flashAmount
        }
        if (waveRadius >= 0) {
          const d = radialDist[i] - waveRadius
          const proximity = Math.exp(-(d * d) / (2 * WAVE_SIGMA * WAVE_SIGMA))
          extra += proximity * waveEnvelope * WAVE_BOOST
        }
        nodeExtraAlpha[i] = extra
      }

      ctx!.clearRect(0, 0, width, height)

      const coreGrad = ctx!.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        radius * LAYERS[0].radiusFactor * 1.4
      )
      coreGrad.addColorStop(0, `rgba(${CORE_HOT}, ${0.8 * breath})`)
      coreGrad.addColorStop(0.3, `rgba(${LAYERS[0].color}, ${0.5 * breath})`)
      coreGrad.addColorStop(0.65, `rgba(190, 90, 255, ${0.28 * breath})`)
      coreGrad.addColorStop(1, `rgba(190, 90, 255, 0)`)
      ctx!.fillStyle = coreGrad
      ctx!.fillRect(0, 0, width, height)

      for (let ei = 0; ei < edges.length; ei++) {
        const edge = edges[ei]
        const a = projected[edge.a]
        const b = projected[edge.b]
        const depth = (a.z + b.z) / 2
        const front = (depth + 1) / 2
        const edgeIntensity = (intensity[edge.a] + intensity[edge.b]) / 2
        const edgeExtra = (nodeExtraAlpha[edge.a] + nodeExtraAlpha[edge.b]) / 2
        const baseAlpha = edge.kind === 'long-range' ? 0.4 : edge.kind === 'bridge' ? 0.36 : 0.28
        const alpha = (0.16 + baseAlpha * front) * breath * edgeIntensity + edgeExtra * front
        ctx!.strokeStyle = `rgba(${edgeColors[ei]}, ${Math.min(alpha, 1)})`
        ctx!.lineWidth = (edge.kind === 'intra' ? 0.75 : 1.05) + front * 0.5
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }

      for (let i = 0; i < projected.length; i++) {
        const n = projected[i]
        const front = (n.z + 1) / 2
        const alpha = (0.44 + 0.55 * front) * breath * intensity[i] + nodeExtraAlpha[i]
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, 0.8 + front * 1 + intensity[i] * 0.6 + nodeExtraAlpha[i] * 0.8, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${colors[i]}, ${Math.min(alpha, 1)})`
        ctx!.fill()
      }

      for (const spark of sparks) {
        let progress = (now - spark.start) / spark.duration
        if (progress >= 1) {
          spark.edgeIndex = Math.floor(Math.random() * edges.length)
          spark.start = now
          spark.duration = SPARK_DURATION_MS * (0.7 + Math.random() * 0.6)
          progress = 0
        }
        const edge = edges[spark.edgeIndex]
        const a = projected[edge.a]
        const b = projected[edge.b]
        const envelope = Math.sin(progress * Math.PI)
        const sparkColor = lightenRgb(edgeColors[spark.edgeIndex], 0.6)
        ctx!.shadowColor = `rgba(${edgeColors[spark.edgeIndex]}, 0.9)`

        for (let trail = SPARK_TRAIL_STEPS; trail >= 0; trail--) {
          const trailProgress = progress - trail * 0.03
          if (trailProgress < 0) continue
          const x = a.x + (b.x - a.x) * trailProgress
          const y = a.y + (b.y - a.y) * trailProgress
          const depth = a.z + (b.z - a.z) * trailProgress
          const trailFade = 1 - trail / (SPARK_TRAIL_STEPS + 1)
          const fade = envelope * ((depth + 1) / 2 + 0.3) * trailFade
          const size = 2.4 * trailFade + 0.3

          ctx!.beginPath()
          ctx!.arc(x, y, size, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${sparkColor}, ${Math.min(fade, 1)})`
          ctx!.shadowBlur = 10 * trailFade
          ctx!.fill()
        }
      }
      ctx!.shadowBlur = 0

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className="neural-idle">
      <canvas ref={canvasRef} />
    </div>
  )
}
