import type { GeoJSONFeature, FilterSpecification } from 'maplibre-gl'
import { useMap } from './Map'

export interface queryFeatures {
    tiles: string
    source: string
    filter?: FilterSpecification
}

const svgNS = 'http://www.w3.org/2000/svg'
let svg = document.createElementNS(svgNS, 'svg')
let svgGroupElement = document.createElementNS(svgNS, 'g')

export function useSvgExport() {
    const { map } = useMap()
    const exportSvg = (queryFeatures: queryFeatures[]) => {
        if (!map.value) {
            console.warn('map is undefined')
            return
        }
        resetSvg()
        const width = map.value.getContainer().offsetWidth
        const height = map.value.getContainer().offsetHeight
        svg.setAttribute('width', width?.toString() || '420')
        svg.setAttribute('height', height?.toString() || '420')
        svg.setAttribute('viewbox', `0 0 ${width} ${height}`)
        svg.style.background = '#000'

        queryFeatures.forEach((qf) => {
            const seenFeatureIds = new Set()
            resetSvgGroup()
            svgGroupElement.id = qf.source
            map.value
                ?.querySourceFeatures(qf.tiles, {
                    sourceLayer: qf.source,
                    filter: qf.filter,
                })
                .forEach((feature) => {
                    if (feature.id && !seenFeatureIds.has(feature.id)) {
                        seenFeatureIds.add(feature.id)
                        createSvgLineByFeature(feature)
                    }
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
    const coordsToPath = (coords: number[][]): string => {
        return coords
            .map(([lng, lat]) => {
                const pixel = map.value?.project([lng, lat])
                return `${pixel?.x.toFixed(2)},${pixel?.y.toFixed(2)}`
            })
            .join(' L')
    }

    const createSvgLineByFeature = (feature: GeoJSONFeature): void => {
        const geo = feature.geometry
        switch (geo.type) {
            case 'LineString':
                createSvgLine(geo.coordinates)
                break
            case 'MultiLineString':
                geo.coordinates.forEach(createSvgLine)
                break
            case 'Polygon':
                geo.coordinates.forEach(createSvgLine)
                break
            case 'MultiPolygon':
                geo.coordinates.forEach((polygons) => polygons.forEach(createSvgLine))
                break
            default:
                console.warn(`Unsupported geometry type: ${geo.type}`)
        }
    }

    const createSvgLine = (el: number[][]): void => {
        const path = document.createElementNS(svgNS, 'path')
        const d = `M${coordsToPath(el)}`
        path.setAttribute('d', d)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', '#ffffff')
        path.setAttribute('stroke-width', '1')
        svgGroupElement.appendChild(path)
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
