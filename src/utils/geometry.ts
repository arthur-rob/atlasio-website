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

// Clips a polyline to bounds, splitting it into several runs when it leaves and re-enters.
// A closed line keeps its start and end runs joined, so it is cut only where it leaves the bounds.
export const clipPolyline = (points: Point[], b: Bounds): Point[][] => {
    const runs = clipOpenPolyline(points, b)
    const first = points[0]!
    const last = points[points.length - 1]!
    const isClosed = points.length > 3 && first.x === last.x && first.y === last.y
    if (!isClosed || runs.length < 2) return runs
    const startRun = runs[0]!
    const endRun = runs[runs.length - 1]!
    if (startRun[0] !== first || endRun[endRun.length - 1] !== last) return runs
    return [[...endRun, ...startRun.slice(1)], ...runs.slice(1, -1)]
}

const clipOpenPolyline = (points: Point[], b: Bounds): Point[][] => {
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
    return convexPolygon(vertices)
}

// Convex polygon from its vertices, in any winding order
export const convexPolygon = (vertices: Point[]): ConvexShape => {
    const center = {
        x: vertices.reduce((sum, p) => sum + p.x, 0) / vertices.length,
        y: vertices.reduce((sum, p) => sum + p.y, 0) / vertices.length,
    }
    const edges = vertices.map((point, i) => {
        const next = vertices[(i + 1) % vertices.length]!
        const normal = { x: next.y - point.y, y: point.x - next.x }
        // Flip normals pointing towards the centre so they all point outwards
        const inwards = normal.x * (center.x - point.x) + normal.y * (center.y - point.y) > 0
        return { point, normal: inwards ? { x: -normal.x, y: -normal.y } : normal }
    })
    return { bounds: boundsOf(vertices), edges }
}

// Grid of shapes, to only test the few shapes near a segment
export class ShapeIndex {
    private cells = new Map<string, ConvexShape[]>()

    constructor(private cellSize = 32) {}

    private forEachCell(b: Bounds, callback: (key: string) => void) {
        for (
            let x = Math.floor(b.minX / this.cellSize);
            x <= Math.floor(b.maxX / this.cellSize);
            x++
        ) {
            for (
                let y = Math.floor(b.minY / this.cellSize);
                y <= Math.floor(b.maxY / this.cellSize);
                y++
            ) {
                callback(`${x},${y}`)
            }
        }
    }

    add(shape: ConvexShape) {
        this.forEachCell(shape.bounds, (key) => {
            const cell = this.cells.get(key) ?? []
            this.cells.set(key, cell)
            cell.push(shape)
        })
    }

    query(b: Bounds): ConvexShape[] {
        const found = new Set<ConvexShape>()
        this.forEachCell(b, (key) =>
            this.cells.get(key)?.forEach((shape) => {
                if (overlaps(shape.bounds, b)) found.add(shape)
            }),
        )
        return [...found]
    }
}

// Area covered by a line of half width `halfWidth`: one rectangle per segment, one disc per vertex
export const lineBody = (points: Point[], halfWidth: number, discSteps = 8): ConvexShape[] => {
    const shapes: ConvexShape[] = []
    points.forEach((p, i) => {
        shapes.push(
            convexPolygon(
                Array.from({ length: discSteps }, (_, k) => {
                    const angle = (k / discSteps) * Math.PI * 2
                    return {
                        x: p.x + halfWidth * Math.cos(angle),
                        y: p.y + halfWidth * Math.sin(angle),
                    }
                }),
            ),
        )
        const next = points[i + 1]
        if (!next) return
        const length = distance(p, next)
        if (length === 0) return
        const nx = (-(next.y - p.y) / length) * halfWidth
        const ny = ((next.x - p.x) / length) * halfWidth
        shapes.push(
            convexPolygon([
                { x: p.x + nx, y: p.y + ny },
                { x: next.x + nx, y: next.y + ny },
                { x: next.x - nx, y: next.y - ny },
                { x: p.x - nx, y: p.y - ny },
            ]),
        )
    })
    return shapes
}

// Parallel line at `offset` pixels on the left (negative: right), with mitred corners.
// Closed lines (first point = last point) get a corner at their start too, so they stay closed.
export const offsetPolyline = (input: Point[], offset: number): Point[] => {
    const points = input.filter((p, i) => i === 0 || distance(p, input[i - 1]!) > 0)
    if (points.length < 2) return []
    const normals = points.slice(1).map((next, i) => {
        const p = points[i]!
        const length = distance(p, next)
        return { x: -(next.y - p.y) / length, y: (next.x - p.x) / length }
    })
    const shift = (p: Point, n: Point, scale = 1) => ({
        x: p.x + n.x * offset * scale,
        y: p.y + n.y * offset * scale,
    })
    const corner = (p: Point, before: Point, after: Point): Point[] => {
        const miter = { x: before.x + after.x, y: before.y + after.y }
        const length = Math.hypot(miter.x, miter.y)
        const cos = length / 2
        // Very sharp turn: bevel instead of a long spike
        if (cos < 0.35) return [shift(p, before), shift(p, after)]
        return [shift(p, { x: miter.x / length, y: miter.y / length }, 1 / cos)]
    }
    const inner = points.slice(1, -1).flatMap((p, i) => corner(p, normals[i]!, normals[i + 1]!))
    const isClosed = points.length > 3 && distance(points[0]!, points[points.length - 1]!) < 1e-6
    if (isClosed) {
        const start = corner(points[0]!, normals[normals.length - 1]!, normals[0]!)
        return [start[start.length - 1]!, ...inner, ...start]
    }
    return [
        shift(points[0]!, normals[0]!),
        ...inner,
        shift(points[points.length - 1]!, normals[normals.length - 1]!),
    ]
}

// Crossing point of segments [a, b] and [c, d], if they cross
const segmentIntersection = (a: Point, b: Point, c: Point, d: Point): Point | undefined => {
    const r = { x: b.x - a.x, y: b.y - a.y }
    const s = { x: d.x - c.x, y: d.y - c.y }
    const denominator = r.x * s.y - r.y * s.x
    if (denominator === 0) return undefined
    const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / denominator
    const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / denominator
    if (t < 0 || t > 1 || u < 0 || u > 1) return undefined
    return lerp(a, b, t)
}

// Joins lines whose ends are within `tolerance` pixels into one continuous line, when exactly two
// line ends meet there (a junction of three lines or more is left as is). Lines may be reversed.
export const mergeConnectedLines = (lines: Point[][], tolerance: number): Point[][] => {
    interface End {
        line: number
        atStart: boolean
        point: Point
    }
    const cell = (p: Point) => [Math.floor(p.x / tolerance), Math.floor(p.y / tolerance)] as const
    const grid = new Map<string, End[]>()
    lines.forEach((line, index) => {
        if (line.length < 2) return
        ;[true, false].forEach((atStart) => {
            const point = atStart ? line[0]! : line[line.length - 1]!
            const key = cell(point).join()
            grid.set(key, [...(grid.get(key) ?? []), { line: index, atStart, point }])
        })
    })
    const near = (end: End): End[] => {
        const [cx, cy] = cell(end.point)
        const found: End[] = []
        for (let x = cx - 1; x <= cx + 1; x++) {
            for (let y = cy - 1; y <= cy + 1; y++) {
                grid.get(`${x},${y}`)?.forEach((other) => {
                    const isSelf = other.line === end.line && other.atStart === end.atStart
                    if (!isSelf && distance(other.point, end.point) <= tolerance) found.push(other)
                })
            }
        }
        return found
    }
    // The single end meeting `end`, if the two of them are alone at that point
    const partnerOf = (end: End): End | undefined => {
        const candidates = near(end)
        if (candidates.length !== 1) return undefined
        return near(candidates[0]!).length === 1 ? candidates[0] : undefined
    }
    const endOf = (line: number, atStart: boolean): End => {
        const points = lines[line]!
        return { line, atStart, point: atStart ? points[0]! : points[points.length - 1]! }
    }

    const used = new Set<number>()
    // Follows the chain from its tail, appending the connected lines; returns the final tail
    const extend = (chain: Point[], tail: End): End => {
        for (;;) {
            const next = partnerOf(tail)
            if (!next || used.has(next.line)) return tail
            used.add(next.line)
            const points = next.atStart ? lines[next.line]! : [...lines[next.line]!].reverse()
            const last = chain[chain.length - 1]!
            // Ends overshooting each other (road edges at a corner) would draw a small loop:
            // cut both lines where they cross instead
            const crossing =
                chain.length > 1 && points.length > 1
                    ? segmentIntersection(chain[chain.length - 2]!, last, points[0]!, points[1]!)
                    : undefined
            if (crossing) {
                chain[chain.length - 1] = crossing
                chain.push(...points.slice(1))
            } else {
                // Same point twice when both lines share it; otherwise keep both to draw the corner
                chain.push(...points.slice(distance(last, points[0]!) < 1e-3 ? 1 : 0))
            }
            tail = endOf(next.line, !next.atStart)
        }
    }

    const merged: Point[][] = []
    lines.forEach((line, index) => {
        if (used.has(index) || line.length < 2) return
        used.add(index)
        const chain = [...line]
        const head = extend(chain, endOf(index, false))
        chain.reverse()
        const tail = extend(chain, endOf(index, true))
        // Both ends of the chain meet: close the loop
        const closing = partnerOf(tail)
        if (closing?.line === head.line && closing.atStart === head.atStart) {
            const n = chain.length
            const crossing =
                n > 3
                    ? segmentIntersection(chain[n - 2]!, chain[n - 1]!, chain[0]!, chain[1]!)
                    : undefined
            if (crossing) {
                // Overshooting ends: close the loop at their crossing point
                chain[0] = crossing
                chain[n - 1] = crossing
            } else {
                chain.push(chain[0]!)
            }
        }
        merged.push(chain)
    })
    return merged
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

// Cuts the parts of a polyline inside any of the indexed shapes, splitting it into visible runs
export const removeShapes = (points: Point[], index: ShapeIndex): Point[][] => {
    const runs: Point[][] = []
    let current: Point[] = [points[0]!]
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!
        const b = points[i + 1]!
        const hidden = index
            .query(boundsOf([a, b]))
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
