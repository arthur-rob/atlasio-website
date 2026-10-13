import { MercatorCoordinate, type GeoJSONFeature, type LngLat } from 'maplibre-gl'

export interface Point {
    x: number
    y: number
}

export interface Bounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

// Internal maplibre vector tile feature: geometry in tile coordinates, tile id stored by GeoJSONFeature
export interface TileFeature {
    type: number
    extent: number
    _x: number
    _y: number
    _z: number
    loadGeometry(): Point[][]
}

export const LINESTRING_TYPE = 2
export const POLYGON_TYPE = 3

// Closed upward triangle of width `size` centred on `center`
export const trianglePoints = (center: Point, size: number): Point[] => {
    const height = (size * Math.sqrt(3)) / 2
    const top = { x: center.x, y: center.y - (height * 2) / 3 }
    return [
        top,
        { x: center.x + size / 2, y: center.y + height / 3 },
        { x: center.x - size / 2, y: center.y + height / 3 },
        top,
    ]
}

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export const getTileFeature = (feature: GeoJSONFeature): TileFeature | undefined => {
    const tile = feature._vectorTileFeature as unknown as TileFeature | undefined
    return tile && typeof tile.loadGeometry === 'function' && tile._z !== undefined
        ? tile
        : undefined
}

export const tileKey = (tile: TileFeature) => `${tile._z}/${tile._x}/${tile._y}`

export const tileToLngLat = (tile: TileFeature, p: Point): LngLat => {
    const size = tile.extent * 2 ** tile._z
    return new MercatorCoordinate(
        (tile._x * tile.extent + p.x) / size,
        (tile._y * tile.extent + p.y) / size,
    ).toLngLat()
}

// Liang–Barsky: parameter range [t0, t1] of segment [p0, p1] inside bounds, or null
const segmentInterval = (p0: Point, p1: Point, b: Bounds): [number, number] | null => {
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    let t0 = 0
    let t1 = 1
    const checks: [number, number][] = [
        [-dx, p0.x - b.minX],
        [dx, b.maxX - p0.x],
        [-dy, p0.y - b.minY],
        [dy, b.maxY - p0.y],
    ]
    for (const [p, q] of checks) {
        if (p === 0) {
            if (q < 0) return null
            continue
        }
        const r = q / p
        if (p < 0) {
            if (r > t1) return null
            if (r > t0) t0 = r
        } else {
            if (r < t0) return null
            if (r < t1) t1 = r
        }
    }
    return [t0, t1]
}

const lerp = (p0: Point, p1: Point, t: number): Point => ({
    x: p0.x + t * (p1.x - p0.x),
    y: p0.y + t * (p1.y - p0.y),
})

// Returns the part of segment [p0, p1] inside bounds, or null
const clipSegment = (p0: Point, p1: Point, b: Bounds): [Point, Point] | null => {
    const interval = segmentInterval(p0, p1, b)
    if (!interval) return null
    const [t0, t1] = interval
    return [t0 === 0 ? p0 : lerp(p0, p1, t0), t1 === 1 ? p1 : lerp(p0, p1, t1)]
}

// Clips a polyline to bounds, splitting it into several runs when it leaves and re-enters
export const clipPolyline = (points: Point[], b: Bounds): Point[][] => {
    const runs: Point[][] = []
    let current: Point[] = []
    for (let i = 0; i < points.length - 1; i++) {
        const seg = clipSegment(points[i]!, points[i + 1]!, b)
        if (!seg) {
            if (current.length > 1) runs.push(current)
            current = []
            continue
        }
        const [start, end] = seg
        const last = current[current.length - 1]
        if (!last || last.x !== start.x || last.y !== start.y) {
            if (current.length > 1) runs.push(current)
            current = [start]
        }
        current.push(end)
    }
    if (current.length > 1) runs.push(current)
    return runs
}

const overlaps = (a: Bounds, b: Bounds) =>
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY

export const boundsOf = (points: Point[], padding = 0): Bounds => {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    return {
        minX: Math.min(...xs) - padding,
        minY: Math.min(...ys) - padding,
        maxX: Math.max(...xs) + padding,
        maxY: Math.max(...ys) + padding,
    }
}

// Convex area, as edges with outward normals, plus its bounds for a quick overlap test
export interface ConvexShape {
    bounds: Bounds
    edges: { point: Point; normal: Point }[]
}

// Rectangle with corners rounded by `radius`, approximated by a convex polygon
export const roundedRect = (b: Bounds, radius: number, cornerSteps = 4): ConvexShape => {
    const r = Math.min(radius, (b.maxX - b.minX) / 2, (b.maxY - b.minY) / 2)
    const corners = [
        { x: b.maxX - r, y: b.minY + r, start: -Math.PI / 2 },
        { x: b.maxX - r, y: b.maxY - r, start: 0 },
        { x: b.minX + r, y: b.maxY - r, start: Math.PI / 2 },
        { x: b.minX + r, y: b.minY + r, start: Math.PI },
    ]
    const vertices = corners.flatMap(({ x, y, start }) =>
        Array.from({ length: cornerSteps + 1 }, (_, i) => {
            const angle = start + (i / cornerSteps) * (Math.PI / 2)
            return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) }
        }),
    )
    // Vertices go clockwise on screen (y down), so (dy, -dx) points outwards
    const edges = vertices.map((point, i) => {
        const next = vertices[(i + 1) % vertices.length]!
        return { point, normal: { x: next.y - point.y, y: point.x - next.x } }
    })
    return { bounds: b, edges }
}

// Cyrus–Beck: parameter range [t0, t1] of segment [p0, p1] inside a convex shape, or null
const shapeInterval = (p0: Point, p1: Point, shape: ConvexShape): [number, number] | null => {
    const d = { x: p1.x - p0.x, y: p1.y - p0.y }
    let t0 = 0
    let t1 = 1
    for (const { point, normal } of shape.edges) {
        const num = normal.x * (p0.x - point.x) + normal.y * (p0.y - point.y)
        const den = normal.x * d.x + normal.y * d.y
        if (den === 0) {
            if (num > 0) return null
            continue
        }
        const t = -num / den
        if (den < 0) t0 = Math.max(t0, t)
        else t1 = Math.min(t1, t)
        if (t0 > t1) return null
    }
    return [t0, t1]
}

// Cuts the parts of a polyline inside any of the shapes, splitting it into visible runs
export const removeShapes = (points: Point[], shapes: ConvexShape[]): Point[][] => {
    const lineBounds = boundsOf(points)
    const hits = shapes.filter((shape) => overlaps(shape.bounds, lineBounds))
    if (!hits.length) return [points]

    const runs: Point[][] = []
    let current: Point[] = [points[0]!]
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!
        const b = points[i + 1]!
        const hidden = hits
            .map((shape) => shapeInterval(a, b, shape))
            .filter(
                (interval): interval is [number, number] => !!interval && interval[1] > interval[0],
            )
            .sort((x, y) => x[0] - y[0])
        let t = 0
        for (const [t0, t1] of hidden) {
            if (t1 <= t) continue
            if (t0 > t) current.push(lerp(a, b, t0))
            if (current.length > 1) runs.push(current)
            t = t1
            current = t < 1 ? [lerp(a, b, t)] : []
        }
        if (t < 1) current.push(b)
        else current = [b]
    }
    if (current.length > 1) runs.push(current)
    return runs
}
