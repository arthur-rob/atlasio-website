import type { GeoJSONFeature } from 'maplibre-gl'
import {
    clipPolyline,
    distance,
    getTileFeature,
    tileKey,
    POLYGON_TYPE,
    type Point,
    type TileFeature,
} from './geometry'

// Screen distance between two hatch lines, in pixels, whatever the zoom level
export const HATCH_SPACING = 12
// Angle of the line normal per overlap depth: "/" for one polygon, "\" added where two overlap,
// then horizontal and vertical lines for deeper overlaps
const HATCH_ANGLES = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, 0]
// maplibre world size in pixels at zoom 0
const WORLD_TILE_SIZE = 512

export interface TileHatch {
    tile: TileFeature
    // Index in HATCH_ANGLES, i.e. how many polygons overlap under these lines
    depth: number
    // Tile coordinates, clipped to the tile
    segments: Point[][]
}

// Lines of normal `angle` covering the area where at least `depth` polygons overlap.
// Each polygon is filled with the even-odd rule over its rings (handles holes).
// `origin` is the tile position in world units, so lines of neighbouring tiles line up.
const hatchDepth = (
    polygons: Point[][][],
    depth: number,
    angle: number,
    spacing: number,
    origin: Point,
): Point[][] => {
    const nx = Math.cos(angle)
    const ny = Math.sin(angle)
    const across = (p: Point) => p.x * nx + p.y * ny
    const along = (p: Point) => p.y * nx - p.x * ny
    const offset = across(origin)

    let min = Infinity
    let max = -Infinity
    polygons.flat(2).forEach((p) => {
        min = Math.min(min, across(p))
        max = Math.max(max, across(p))
    })

    const segments: Point[][] = []
    for (let k = Math.ceil((min + offset) / spacing); k <= (max + offset) / spacing; k++) {
        const c = k * spacing - offset
        const crossings: { point: Point; polygon: number }[] = []
        polygons.forEach((rings, polygon) =>
            rings.forEach((ring) => {
                for (let i = 0; i < ring.length - 1; i++) {
                    const a = ring[i]!
                    const b = ring[i + 1]!
                    const ca = across(a)
                    const cb = across(b)
                    if (ca < c === cb < c) continue
                    const t = (c - ca) / (cb - ca)
                    crossings.push({
                        point: { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) },
                        polygon,
                    })
                }
            }),
        )
        crossings.sort((a, b) => along(a.point) - along(b.point))

        const inside = polygons.map(() => false)
        let count = 0
        let start: Point | undefined
        crossings.forEach(({ point, polygon }) => {
            inside[polygon] = !inside[polygon]
            count += inside[polygon] ? 1 : -1
            if (count >= depth && !start) {
                start = point
            } else if (count < depth && start) {
                if (distance(start, point) > 0) segments.push([start, point])
                start = undefined
            }
        })
    }
    return segments
}

// Hatches polygon features tile by tile, crossing the hatch where polygons overlap
export const hatchFeatures = (features: GeoJSONFeature[], zoom: number): TileHatch[] => {
    const tiles = new Map<string, { tile: TileFeature; polygons: Point[][][]; seen: Set<string> }>()
    features.forEach((feature) => {
        const tile = getTileFeature(feature)
        if (!tile || tile.type !== POLYGON_TYPE) return
        const group = tiles.get(tileKey(tile)) ?? { tile, polygons: [], seen: new Set() }
        tiles.set(tileKey(tile), group)
        const rings = tile.loadGeometry()
        // Overzoomed tiles return the same feature several times: it must not count as an overlap
        const signature = JSON.stringify(rings)
        if (group.seen.has(signature)) return
        group.seen.add(signature)
        group.polygons.push(rings)
    })

    const hatches: TileHatch[] = []
    tiles.forEach(({ tile, polygons }) => {
        const { extent } = tile
        const spacing = (HATCH_SPACING * extent * 2 ** tile._z) / (WORLD_TILE_SIZE * 2 ** zoom)
        const origin = { x: tile._x * extent, y: tile._y * extent }
        const bounds = { minX: 0, minY: 0, maxX: extent, maxY: extent }
        const maxDepth = Math.min(polygons.length, HATCH_ANGLES.length)
        for (let depth = 1; depth <= maxDepth; depth++) {
            const segments = hatchDepth(polygons, depth, HATCH_ANGLES[depth - 1]!, spacing, origin)
            hatches.push({
                tile,
                depth,
                segments: segments.flatMap((segment) => clipPolyline(segment, bounds)),
            })
        }
    })
    return hatches
}
