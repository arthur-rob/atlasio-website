import type { GeoJSONFeature, FilterSpecification } from 'maplibre-gl'
import { useMap } from './Map'
import { interpolateZoom, SUMMIT_SIZE, type LayerExportStyle } from '@/constants/map'
import {
    boundsOf,
    clipPolyline,
    lineBody,
    mergeConnectedLines,
    offsetPolyline,
    removeShapes,
    ShapeIndex,
    roundedRect,
    distance,
    getTileFeature,
    tileKey,
    tileToLngLat,
    trianglePoints,
    LINESTRING_TYPE,
    POLYGON_TYPE,
    type Bounds,
    type ConvexShape,
    type Point,
    type TileFeature,
} from '@/utils/geometry'
import { hatchFeatures, mercatorViewBounds } from '@/utils/hatch'
import { textCapHeight, textToPolylines } from '@/utils/hersheyText'

export interface QueryFeatures extends LayerExportStyle {
    tiles: string
    source: string
    filter?: FilterSpecification
}

// Pixel-space line, flagged when an end was cut by a tile border
interface Polyline {
    points: Point[]
    startOnEdge: boolean
    endOnEdge: boolean
}

// Max pixel gap between two tile pieces to stitch (tiles are simplified independently)
const MERGE_TOLERANCE = 2
const DEFAULT_STROKE = '#ffffff'
// Label font size and spacing, in pixels / em
const LABEL_SIZE = 11
const LABEL_GAP = 3
const LABEL_LINE_GAP = 0.45
// Road edges are kept when they are this close to another road's edge, so junctions close cleanly
const ROAD_EDGE_MARGIN = 0.3
// Distance under which line ends are joined: shared vertices of two features, and road edges
// meeting at the corner of a junction
const SHARED_VERTEX_TOLERANCE = 0.05
const ROAD_CORNER_TOLERANCE = 0.75
// Empty margin kept around labels and markers, where other lines are cut
const KNOCKOUT_PADDING = 3.5
const KNOCKOUT_RADIUS = 3
const svgNS = 'http://www.w3.org/2000/svg'
let svg = document.createElementNS(svgNS, 'svg')

interface SvgPath {
    points: Point[]
    stroke: string
    dash?: string
}

interface SvgGroup {
    id: string
    paths: SvgPath[]
    // Areas this group covers (labels, road bodies): lines of the groups below are cut there,
    // like layers hidden under it on the map
    knockouts: ConvexShape[]
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

const reverseLine = (line: Polyline): Polyline => ({
    points: [...line.points].reverse(),
    startOnEdge: line.endOnEdge,
    endOnEdge: line.startOnEdge,
})

// Joins pieces of the same feature that were cut at tile borders back into continuous lines
const mergeAtTileEdges = (lines: Polyline[]): Point[][] => {
    const alive = new Set(lines)

    // Closest alive line with an edge end near `end`, oriented so that it starts there
    const findPartner = (end: Point): Polyline | undefined => {
        let best: { line: Polyline; reversed: boolean } | undefined
        let bestDistance = MERGE_TOLERANCE
        for (const other of alive) {
            const start = other.points[0]!
            const otherEnd = other.points[other.points.length - 1]!
            if (other.startOnEdge && distance(end, start) <= bestDistance) {
                best = { line: other, reversed: false }
                bestDistance = distance(end, start)
            }
            if (other.endOnEdge && distance(end, otherEnd) <= bestDistance) {
                best = { line: other, reversed: true }
                bestDistance = distance(end, otherEnd)
            }
        }
        if (!best) return undefined
        alive.delete(best.line)
        return best.reversed ? reverseLine(best.line) : best.line
    }

    const extend = (line: Polyline) => {
        while (line.endOnEdge) {
            const next = findPartner(line.points[line.points.length - 1]!)
            if (!next) break
            line.points.push(...next.points.slice(1))
            line.endOnEdge = next.endOnEdge
        }
    }

    const merged: Point[][] = []
    for (const line of lines) {
        if (!alive.has(line)) continue
        alive.delete(line)
        extend(line)
        const reversed = reverseLine(line)
        extend(reversed)
        const { points } = reversed
        // Closed contour spanning several tiles: close the loop
        if (
            reversed.startOnEdge &&
            reversed.endOnEdge &&
            points.length > 2 &&
            distance(points[0]!, points[points.length - 1]!) <= MERGE_TOLERANCE
        ) {
            points.push(points[0]!)
        }
        merged.push(points)
    }
    return merged
}

export function useSvgExport() {
    const { map } = useMap()
    let viewport: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    // Paths are collected first, then written once every label area to clear is known
    let groups: SvgGroup[] = []
    let currentGroup: SvgGroup = { id: '', paths: [], knockouts: [] }

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
        groups = []

        queryFeatures.forEach((qf) => {
            if (qf.skip) return
            currentGroup = { id: qf.source, paths: [], knockouts: [] }
            groups.push(currentGroup)
            // Lines grouped so that only pieces of the same feature (or hatch orientation) get stitched
            const linesByGroup = new Map<string, Polyline[]>()
            const addLines = (key: string, lines: Polyline[]) => {
                const group = linesByGroup.get(key) ?? []
                linesByGroup.set(key, group)
                group.push(...lines)
            }
            const features =
                map.value?.querySourceFeatures(qf.tiles, {
                    sourceLayer: qf.source,
                    filter: qf.filter,
                }) ?? []
            if (qf.marker) {
                createSvgMarkers(features, qf)
            } else if (qf.hatch) {
                hatchFeatures(
                    features,
                    map.value!.getZoom(),
                    qf.hatch,
                    mercatorViewBounds(map.value!),
                ).forEach(({ tile, depth, segments }) =>
                    addLines(`hatch-${depth}`, toTileLines(tile, segments)),
                )
            } else {
                features.forEach((feature) =>
                    addLines(JSON.stringify(feature.properties), getFeatureLines(feature)),
                )
            }
            const merged = [...linesByGroup.values()].flatMap((lines) => {
                // Overzoomed tiles can return the same piece several times
                const seen = new Set<string>()
                const unique = lines.filter((line) => {
                    const key = line.points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join()
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                return mergeAtTileEdges(unique)
            })
            // Separate features drawn as one line (a road split into several ways), for the plotter
            const lines = qf.hatch ? merged : mergeConnectedLines(merged, SHARED_VERTEX_TOLERANCE)
            if (qf.road) createSvgRoads(lines, qf)
            else lines.forEach((line) => createSvgLine(line, qf.stroke ?? DEFAULT_STROKE, qf.dash))
        })
        writeGroups()
        triggerDownload()
    }

    // Writes collected paths, each group cut by the areas covered by the groups above it
    const writeGroups = () => {
        const above = new ShapeIndex()
        const elements = [...groups].reverse().map(({ id, paths, knockouts }) => {
            const group = document.createElementNS(svgNS, 'g')
            group.id = id
            paths.forEach(({ points, stroke, dash }) => {
                const runs = removeShapes(points, above)
                runs.forEach((run) => {
                    const path = document.createElementNS(svgNS, 'path')
                    const d = `M${run.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L')}`
                    path.setAttribute('d', d)
                    path.setAttribute('fill', 'none')
                    path.setAttribute('stroke', stroke)
                    path.setAttribute('stroke-width', '1')
                    if (dash) path.setAttribute('stroke-dasharray', dash)
                    group.appendChild(path)
                })
            })
            knockouts.forEach((shape) => above.add(shape))
            return group
        })
        elements.reverse().forEach((group) => svg.appendChild(group))
    }

    // Roads as on the map: the two black edges left visible by the white fill over the casing.
    // Edges are cut inside other roads, so crossings and junctions stay open like on the map.
    const createSvgRoads = (centerlines: Point[][], qf: QueryFeatures) => {
        if (!qf.road) return
        const zoom = map.value!.getZoom()
        const casing = interpolateZoom(qf.road.casing, zoom)
        const fill = interpolateZoom(qf.road.fill, zoom)
        // Middle of the black band between the fill edge and the casing edge
        const offset = (casing + fill) / 4
        const bodies = new ShapeIndex()
        centerlines.forEach((line) =>
            lineBody(line, offset - ROAD_EDGE_MARGIN).forEach((shape) => bodies.add(shape)),
        )
        const edges = centerlines.flatMap((line) =>
            [offset, -offset].flatMap((side) => removeShapes(offsetPolyline(line, side), bodies)),
        )
        // Edges cut at a junction meet the next road's edge at the corner: draw them as one line
        mergeConnectedLines(edges, ROAD_CORNER_TOLERANCE).forEach((edge) =>
            createSvgLine(edge, qf.stroke ?? DEFAULT_STROKE, qf.dash),
        )
        // Layers under the roads are hidden by the casing on the map
        centerlines.forEach((line) => currentGroup.knockouts.push(...lineBody(line, casing / 2)))
    }

    const resetSvg = () => {
        svg = document.createElementNS(svgNS, 'svg')
    }

    const lngLatToPixel = ([lng, lat]: number[]): Point => {
        const pixel = map.value!.project([lng!, lat!])
        return { x: pixel.x, y: pixel.y }
    }

    const getFeatureLines = (feature: GeoJSONFeature): Polyline[] => {
        const tile = getTileFeature(feature)
        if (tile) return getTileLines(tile)

        const geo = feature.geometry
        const toLine = (coords: number[][]): Polyline => ({
            points: coords.map(lngLatToPixel),
            startOnEdge: false,
            endOnEdge: false,
        })
        switch (geo.type) {
            case 'LineString':
                return [toLine(geo.coordinates)]
            case 'MultiLineString':
            case 'Polygon':
                return geo.coordinates.map(toLine)
            case 'MultiPolygon':
                return geo.coordinates.flatMap((polygons) => polygons.map(toLine))
            default:
                console.warn(`Unsupported geometry type: ${geo.type}`)
                return []
        }
    }

    // Tile-coordinate runs to pixel lines, clipped to the tile (drops the buffer shared with neighbours)
    const toTileLines = (tile: TileFeature, runs: Point[][]): Polyline[] => {
        const { extent } = tile
        const tileBounds: Bounds = { minX: 0, minY: 0, maxX: extent, maxY: extent }
        const isOnEdge = (p: Point) => p.x <= 0 || p.x >= extent || p.y <= 0 || p.y >= extent
        const toPixel = (p: Point): Point => {
            const lngLat = tileToLngLat(tile, p)
            return lngLatToPixel([lngLat.lng, lngLat.lat])
        }
        return runs
            .flatMap((run) => clipPolyline(run, tileBounds))
            .map((run) => ({
                points: run.map(toPixel),
                startOnEdge: isOnEdge(run[0]!),
                endOnEdge: isOnEdge(run[run.length - 1]!),
            }))
    }

    const getTileLines = (tile: TileFeature): Polyline[] => {
        if (tile.type !== LINESTRING_TYPE && tile.type !== POLYGON_TYPE) return []
        return tile
            .loadGeometry()
            .flatMap((ring) =>
                toTileLines(
                    tile,
                    tile.type === POLYGON_TYPE ? removeTileEdges(ring, tile.extent) : [ring],
                ),
            )
    }

    const isInViewport = (p: Point) =>
        p.x >= viewport.minX && p.x <= viewport.maxX && p.y >= viewport.minY && p.y <= viewport.maxY

    const createSvgMarkers = (features: GeoJSONFeature[], qf: QueryFeatures): void => {
        const stroke = qf.stroke ?? DEFAULT_STROKE
        const seen = new Set<string>()
        features.forEach((feature) => {
            const tile = getTileFeature(feature)
            const points: { center: Point; key: string }[] = []
            if (tile) {
                // A point is repeated in the buffer of neighbouring tiles: keep it only in its own tile
                tile.loadGeometry()
                    .flat()
                    .filter((p) => p.x >= 0 && p.x < tile.extent && p.y >= 0 && p.y < tile.extent)
                    .forEach((p) => {
                        const lngLat = tileToLngLat(tile, p)
                        points.push({
                            center: lngLatToPixel([lngLat.lng, lngLat.lat]),
                            key: `${tileKey(tile)}@${p.x},${p.y}`,
                        })
                    })
            } else if (feature.geometry.type === 'Point') {
                const center = lngLatToPixel(feature.geometry.coordinates)
                points.push({ center, key: `${center.x.toFixed(1)},${center.y.toFixed(1)}` })
            }
            points.forEach(({ center, key }) => {
                // Overzoomed tiles return the same point several times
                if (!isInViewport(center) || seen.has(key)) return
                seen.add(key)
                const triangle = trianglePoints(center, SUMMIT_SIZE)
                currentGroup.knockouts.push(
                    roundedRect(boundsOf(triangle, KNOCKOUT_PADDING), KNOCKOUT_RADIUS),
                )
                createSvgLine(triangle, stroke)
                if (qf.label) createSvgLabel(center, feature.properties, stroke)
            })
        })
    }

    // Name and elevation under a marker, as single-stroke paths the plotter can draw
    const createSvgLabel = (
        center: Point,
        properties: GeoJSONFeature['properties'],
        stroke: string,
    ) => {
        const lines: { text: string; size: number }[] = []
        if (properties.name) lines.push({ text: String(properties.name), size: LABEL_SIZE })
        if (properties.ele !== undefined)
            lines.push({ text: `${properties.ele} m`, size: LABEL_SIZE * 0.85 })
        let baseline = center.y + SUMMIT_SIZE / 2 + LABEL_GAP
        lines.forEach(({ text, size }) => {
            baseline += textCapHeight(size)
            const polylines = textToPolylines(text, {
                x: center.x,
                y: baseline,
                size,
                anchor: 'middle',
            })
            if (!polylines.length) return
            currentGroup.knockouts.push(
                roundedRect(boundsOf(polylines.flat(), KNOCKOUT_PADDING), KNOCKOUT_RADIUS),
            )
            polylines.forEach((polyline) => createSvgLine(polyline, stroke))
            baseline += size * LABEL_LINE_GAP
        })
    }

    const createSvgLine = (pixels: Point[], stroke: string, dash?: string): void => {
        clipPolyline(pixels, viewport).forEach((points) =>
            currentGroup.paths.push({ points, stroke, dash }),
        )
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
