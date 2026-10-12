import { MercatorCoordinate, type GeoJSONFeature, type FilterSpecification } from 'maplibre-gl'
import { useMap } from './Map'

export interface QueryFeatures {
    tiles: string
    source: string
    filter?: FilterSpecification
}

interface Point {
    x: number
    y: number
}

interface Bounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

// Internal maplibre vector tile feature: geometry in tile coordinates, tile id stored by GeoJSONFeature
interface TileFeature {
    type: number
    extent: number
    _x: number
    _y: number
    _z: number
    loadGeometry(): Point[][]
}

const LINESTRING_TYPE = 2
const POLYGON_TYPE = 3
const svgNS = 'http://www.w3.org/2000/svg'
let svg = document.createElementNS(svgNS, 'svg')
let svgGroupElement = document.createElementNS(svgNS, 'g')

// Liang–Barsky: returns the part of segment [p0, p1] inside bounds, or null
const clipSegment = (p0: Point, p1: Point, b: Bounds): [Point, Point] | null => {
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
    const at = (t: number): Point => ({ x: p0.x + t * dx, y: p0.y + t * dy })
    return [t0 === 0 ? p0 : at(t0), t1 === 1 ? p1 : at(t1)]
}

// Clips a polyline to bounds, splitting it into several runs when it leaves and re-enters
const clipPolyline = (points: Point[], b: Bounds): Point[][] => {
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

// Polygons are cut at tile borders by the tile generator: drop those artificial straight edges
const removeTileEdges = (ring: Point[], extent: number): Point[][] => {
    const isOnEdge = (a: Point, b: Point) =>
        (a.x === b.x && (a.x <= 0 || a.x >= extent)) || (a.y === b.y && (a.y <= 0 || a.y >= extent))
    const runs: Point[][] = []
    let current: Point[] = [ring[0]!]
    for (let i = 0; i < ring.length - 1; i++) {
        if (isOnEdge(ring[i]!, ring[i + 1]!)) {
            if (current.length > 1) runs.push(current)
            current = [ring[i + 1]!]
        } else {
            current.push(ring[i + 1]!)
        }
    }
    if (current.length > 1) runs.push(current)
    return runs
}

export function useSvgExport() {
    const { map } = useMap()
    let viewport: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

    const exportSvg = (queryFeatures: QueryFeatures[]) => {
        if (!map.value) {
            console.warn('map is undefined')
            return
        }
        resetSvg()
        const width = map.value.getContainer().offsetWidth || 420
        const height = map.value.getContainer().offsetHeight || 420
        viewport = { minX: 0, minY: 0, maxX: width, maxY: height }
        svg.setAttribute('xmlns', svgNS)
        svg.setAttribute('width', width.toString())
        svg.setAttribute('height', height.toString())
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        svg.style.background = '#000'

        queryFeatures.forEach((qf) => {
            const seenFeatureIds = new Set<string>()
            resetSvgGroup()
            svgGroupElement.id = qf.source
            map.value
                ?.querySourceFeatures(qf.tiles, {
                    sourceLayer: qf.source,
                    filter: qf.filter,
                })
                .forEach((feature) => {
                    // A feature spanning several tiles is returned once per tile: keep every tile piece
                    const tile = getTileFeature(feature)
                    const key = `${tile ? `${tile._z}/${tile._x}/${tile._y}` : ''}/${feature.id}`
                    if (feature.id !== undefined && seenFeatureIds.has(key)) return
                    seenFeatureIds.add(key)
                    createSvgLineByFeature(feature)
                })
            svg.appendChild(svgGroupElement)
        })
        triggerDownload()
    }

    const resetSvg = () => {
        svg = document.createElementNS(svgNS, 'svg')
    }

    const resetSvgGroup = () => {
        svgGroupElement = document.createElementNS(svgNS, 'g')
    }

    const getTileFeature = (feature: GeoJSONFeature): TileFeature | undefined => {
        const tile = feature._vectorTileFeature as unknown as TileFeature | undefined
        return tile && typeof tile.loadGeometry === 'function' && tile._z !== undefined
            ? tile
            : undefined
    }

    const lngLatToPixel = ([lng, lat]: number[]): Point => {
        const pixel = map.value!.project([lng!, lat!])
        return { x: pixel.x, y: pixel.y }
    }

    const createSvgLineByFeature = (feature: GeoJSONFeature): void => {
        const tile = getTileFeature(feature)
        if (tile) {
            createSvgLinesFromTile(tile)
            return
        }
        const geo = feature.geometry
        const draw = (coords: number[][]) => createSvgLine(coords.map(lngLatToPixel))
        switch (geo.type) {
            case 'LineString':
                draw(geo.coordinates)
                break
            case 'MultiLineString':
            case 'Polygon':
                geo.coordinates.forEach(draw)
                break
            case 'MultiPolygon':
                geo.coordinates.forEach((polygons) => polygons.forEach(draw))
                break
            default:
                console.warn(`Unsupported geometry type: ${geo.type}`)
        }
    }

    const createSvgLinesFromTile = (tile: TileFeature): void => {
        if (tile.type !== LINESTRING_TYPE && tile.type !== POLYGON_TYPE) return
        const { extent } = tile
        const size = extent * 2 ** tile._z
        const tileBounds: Bounds = { minX: 0, minY: 0, maxX: extent, maxY: extent }
        const toPixel = (p: Point): Point => {
            const lngLat = new MercatorCoordinate(
                (tile._x * extent + p.x) / size,
                (tile._y * extent + p.y) / size,
            ).toLngLat()
            return lngLatToPixel([lngLat.lng, lngLat.lat])
        }

        tile.loadGeometry().forEach((ring) => {
            const runs = tile.type === POLYGON_TYPE ? removeTileEdges(ring, extent) : [ring]
            // Clip to the tile itself (drops the tile buffer shared with neighbours)
            runs.flatMap((run) => clipPolyline(run, tileBounds)).forEach((run) =>
                createSvgLine(run.map(toPixel)),
            )
        })
    }

    const createSvgLine = (pixels: Point[]): void => {
        clipPolyline(pixels, viewport).forEach((run) => {
            const path = document.createElementNS(svgNS, 'path')
            const d = `M${run.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')}`
            path.setAttribute('d', d)
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', '#ffffff')
            path.setAttribute('stroke-width', '1')
            svgGroupElement.appendChild(path)
        })
    }

    const triggerDownload = () => {
        const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const d = new Date()
        const ts = `${d.getMonth() + 1}${d.getDate()}-${d.getHours()}:${d.getMinutes()}`
        a.href = url
        a.download = `export_${ts}.svg`
        a.click()
        URL.revokeObjectURL(url)
    }

    return {
        exportSvg,
    }
}
