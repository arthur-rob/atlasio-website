import { MercatorCoordinate, type GeoJSONFeature, type Map as MapLibreMap } from 'maplibre-gl'
import {
    boundsOf,
    clipPolyline,
    distance,
    getTileFeature,
    tileKey,
    POLYGON_TYPE,
    type Bounds,
    type Point,
    type TileFeature,
} from './geometry'

// Angle of the normal of the hatch lines, for each line direction
export const HATCH_SLASH = Math.PI / 4
export const HATCH_BACKSLASH = -Math.PI / 4
export const HATCH_HORIZONTAL = Math.PI / 2
export const HATCH_VERTICAL = 0

export interface HatchStyle {
    // Screen distance between two hatch lines, in pixels, whatever the zoom level
    spacing: number
    // Line direction per overlap depth: angles[0] for one polygon, angles[1] added where two
    // overlap, and so on
    angles: number[]
}
// maplibre world size in pixels at zoom 0
const WORLD_TILE_SIZE = 512

export interface TileHatch {
    tile: TileFeature
    // Index in HatchStyle.angles, i.e. how many polygons overlap under these lines
    depth: number
    // Tile coordinates, clipped to the tile (and the view when given)
    segments: Point[][]
}

const intersect = (a: Bounds, b: Bounds): Bounds | undefined => {
    const bounds = {
        minX: Math.max(a.minX, b.minX),
        minY: Math.max(a.minY, b.minY),
        maxX: Math.min(a.maxX, b.maxX),
        maxY: Math.min(a.maxY, b.maxY),
    }
    return bounds.minX < bounds.maxX && bounds.minY < bounds.maxY ? bounds : undefined
}

// Visible area of the map in mercator coordinates (0..1), bounding box of the 4 screen corners
export const mercatorViewBounds = (
    map: Pick<MapLibreMap, 'getContainer' | 'unproject'>,
): Bounds => {
    const { clientWidth: width, clientHeight: height } = map.getContainer()
    const corners = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
    ].map(([x, y]) => MercatorCoordinate.fromLngLat(map.unproject([x!, y!])))
    return boundsOf(corners)
}

// Lines of normal `angle` covering the area where at least `depth` polygons overlap, inside `bounds`.
// Each polygon is filled with the even-odd rule over its rings (handles holes).
// `origin` is the tile position in world units, so lines of neighbouring tiles line up.
const hatchDepth = (
    polygons: Point[][][],
    depth: number,
    angle: number,
    spacing: number,
    origin: Point,
    bounds: Bounds,
): Point[][] => {
    const nx = Math.cos(angle)
    const ny = Math.sin(angle)
    const across = (p: Point) => p.x * nx + p.y * ny
    const along = (p: Point) => p.y * nx - p.x * ny
    const offset = across(origin)

    // Only lines crossing the clip bounds are computed
    const limits = [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.maxY },
        { x: bounds.minX, y: bounds.maxY },
    ].map(across)
    const kMin = Math.ceil((Math.min(...limits) + offset) / spacing)
    const kMax = Math.floor((Math.max(...limits) + offset) / spacing)

    // Each edge crosses lines c = k * spacing - offset with c in (lo, hi]: bucket crossings by line
    const crossingsByLine = new Map<number, { point: Point; polygon: number }[]>()
    polygons.forEach((rings, polygon) =>
        rings.forEach((ring) => {
            for (let i = 0; i < ring.length - 1; i++) {
                const a = ring[i]!
                const b = ring[i + 1]!
                const ca = across(a)
                const cb = across(b)
                if (ca === cb) continue
                const from = Math.max(kMin, Math.floor((Math.min(ca, cb) + offset) / spacing) + 1)
                const to = Math.min(kMax, Math.floor((Math.max(ca, cb) + offset) / spacing))
                for (let k = from; k <= to; k++) {
                    const t = (k * spacing - offset - ca) / (cb - ca)
                    const crossings = crossingsByLine.get(k) ?? []
                    crossingsByLine.set(k, crossings)
                    crossings.push({
                        point: { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) },
                        polygon,
                    })
                }
            }
        }),
    )

    const segments: Point[][] = []
    crossingsByLine.forEach((crossings) => {
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
    })
    return segments.flatMap((segment) => clipPolyline(segment, bounds))
}

// Hatches polygon features tile by tile, crossing the hatch where polygons overlap.
// `view` (mercator bounds) limits the work to the visible area.
export const hatchFeatures = (
    features: GeoJSONFeature[],
    zoom: number,
    { spacing: screenSpacing, angles }: HatchStyle,
    view?: Bounds,
): TileHatch[] => {
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
        const size = extent * 2 ** tile._z
        const tileBounds = { minX: 0, minY: 0, maxX: extent, maxY: extent }
        const viewBounds = view && {
            minX: view.minX * size - tile._x * extent,
            minY: view.minY * size - tile._y * extent,
            maxX: view.maxX * size - tile._x * extent,
            maxY: view.maxY * size - tile._y * extent,
        }
        const bounds = viewBounds ? intersect(tileBounds, viewBounds) : tileBounds
        if (!bounds) return
        const visible = polygons.filter((rings) => intersect(boundsOf(rings.flat()), bounds))
        const spacing = (screenSpacing * size) / (WORLD_TILE_SIZE * 2 ** zoom)
        const origin = { x: tile._x * extent, y: tile._y * extent }
        const maxDepth = Math.min(visible.length, angles.length)
        for (let depth = 1; depth <= maxDepth; depth++) {
            const angle = angles[depth - 1]!
            const segments = hatchDepth(visible, depth, angle, spacing, origin, bounds)
            hatches.push({ tile, depth, segments })
        }
    })
    return hatches
}
