import { ref, onMounted, onUnmounted } from 'vue'
import { MAP_LAYERS, MAP_SOURCES } from '@/constants/map'
import maplibregl, { GeoJSONFeature, Map, type MapOptions } from 'maplibre-gl'

export function useMap(containerId: string, options?: MapOptions) {
    const map = ref<Map | null>(null)
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')

    onMounted(() => {
        map.value = new maplibregl.Map({
            container: containerId,
            style: {
                version: 8,
                sources: MAP_SOURCES,
                layers: MAP_LAYERS,
            },
            center: [5.420586, 43.210837],
            zoom: 14,
            ...options,
        })
        map.value?.on('load', initMap)
    })

    onUnmounted(() => {
        if (!map.value) return
        map.value.remove()
        map.value = null
    })

    const initMap = () => {
        if (!map.value) return
    }

    const exportSvg = () => {
        resetSvg()
        const width = map.value?.getContainer().offsetWidth
        const height = map.value?.getContainer().offsetHeight
        svg.setAttribute('width', width?.toString() || '420')
        svg.setAttribute('height', height?.toString() || '420')
        svg.style.background = '#000'

        const contourFeatures = map.value?.querySourceFeatures('contours', {
            sourceLayer: 'contour',
        })

        map.value
            ?.querySourceFeatures('planet', {
                sourceLayer: 'building',
            })
            .forEach(createSvgLineByFeature)
        contourFeatures?.forEach(createSvgLineByFeature)

        map.value
            ?.querySourceFeatures('planet', {
                sourceLayer: 'transportation',
                filter: ['!', ['in', ['get', 'class'], ['literal', ['ferry', 'boat', 'waterway']]]],
            })
            .forEach(createSvgLineByFeature)

        triggerDownload()
    }

    const resetSvg = () => {
        const newSvg = document.createElementNS(svgNS, 'svg')
        svg.replaceWith(newSvg)
    }

    const coordsToPath = (coords: number[][]): string => {
        return coords
            .map((coord) => {
                const pixel = map.value.project([coord[0], coord[1]])
                return `${pixel.x},${pixel.y}`
            })
            .join(' L')
    }
    const createSvgLineByFeature = (feature: GeoJSONFeature): void => {
        if (feature.geometry.type == 'MultiLineString')
            feature.geometry.coordinates.forEach((el) => createSvgLine(el))
        else if (feature.geometry.type == 'LineString') createSvgLine(feature.geometry.coordinates)
        else if (feature.geometry.type == 'Polygon') createSvgLine(feature.geometry.coordinates[0])
        else if (feature.geometry.type == 'MultiPolygon')
            feature.geometry.coordinates.forEach((poly) => poly.forEach((el) => createSvgLine(el)))
    }
    const createSvgLine = (el: number[][]): void => {
        const path = document.createElementNS(svgNS, 'path')
        const d = `M${coordsToPath(el)}`
        path.setAttribute('d', d)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', '#fff')
        path.setAttribute('stroke-width', '1')
        svg.appendChild(path)
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
        map,
        exportSvg,
    }
}
