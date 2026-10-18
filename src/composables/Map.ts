import { ref, onUnmounted } from 'vue'
import {
    MAP_LAYERS,
    MAP_SOURCES,
    MAP_GLYPHS,
    HATCH_LAYERS,
    type LayerExportStyle,
    SUMMIT_COLOR,
    SUMMIT_ICON_ID,
    SUMMIT_SIZE,
} from '@/constants/map'
import maplibregl, {
    Map,
    type FillLayerSpecification,
    type GeoJSONSource,
    type MapOptions,
} from 'maplibre-gl'
import { tileToLngLat, trianglePoints } from '@/utils/geometry'
import { hatchFeatures, mercatorViewBounds } from '@/utils/hatch'

const map = ref<Map | null>(null)

// Recomputes the hatch lines for the current view, so their screen spacing stays constant
const updateHatches = () => {
    if (!map.value) return
    const view = mercatorViewBounds(map.value)
    HATCH_LAYERS.forEach(({ layerId, hatchId }) => {
        const source = map.value?.getSource<GeoJSONSource>(hatchId)
        if (!map.value || !source) return
        if (map.value.getLayoutProperty(hatchId, 'visibility') === 'none') return
        const layer = MAP_LAYERS.find((el) => el.id === layerId) as FillLayerSpecification
        const style = (layer.metadata as { export?: LayerExportStyle } | undefined)?.export?.hatch
        if (!style) return
        const features = map.value.querySourceFeatures(layer.source, {
            sourceLayer: layer['source-layer'],
            filter: layer.filter,
        })
        const lines = hatchFeatures(features, map.value.getZoom(), style, view).flatMap(
            ({ tile, segments }) =>
                segments.map((segment) => segment.map((p) => tileToLngLat(tile, p).toArray())),
        )
        source.setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'MultiLineString', coordinates: lines },
                },
            ],
        })
    })
}

// Outlined triangle icon, matching the summit marker drawn by the SVG export
const createTriangleIcon = (color: string, size: number): ImageData => {
    const canvasSize = size + 4
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    trianglePoints({ x: canvasSize / 2, y: canvasSize / 2 }, size).forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
    )
    ctx.stroke()
    return ctx.getImageData(0, 0, canvasSize, canvasSize)
}

let hatchTimeout: ReturnType<typeof setTimeout> | undefined
const scheduleHatches = () => {
    clearTimeout(hatchTimeout)
    hatchTimeout = setTimeout(updateHatches, 100)
}
const isHatchSource = (id: string) => HATCH_LAYERS.some(({ hatchId }) => hatchId === id)

export function useMap() {
    const initMap = (containerId: string, options?: MapOptions): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            try {
                map.value = new maplibregl.Map({
                    container: containerId,
                    style: {
                        version: 8,
                        sources: MAP_SOURCES,
                        layers: MAP_LAYERS,
                        glyphs: MAP_GLYPHS,
                    },
                    center: [5.420586, 43.210837],
                    zoom: 14,
                    ...options,
                })
                map.value.on('styleimagemissing', (e) => {
                    if (e.id === SUMMIT_ICON_ID && !map.value?.hasImage(e.id)) {
                        map.value?.addImage(e.id, createTriangleIcon(SUMMIT_COLOR, SUMMIT_SIZE))
                    }
                })
                map.value.on('moveend', scheduleHatches)
                map.value.on('sourcedata', (e) => {
                    // Map tiles loaded (ignores updates of the hatch sources themselves)
                    if (!isHatchSource(e.sourceId) && e.isSourceLoaded) scheduleHatches()
                })
                map.value.on('load', () => {
                    resolve()
                })
            } catch (error) {
                console.error('Failed to initialize map:', error)
                reject(error)
            }
        })
    }

    const addExternalStyleLayers = async (styleUrl: string, sourceName: string): Promise<void> => {
        if (!map.value) return

        try {
            const response = await fetch(styleUrl)
            const styleJson = await response.json()

            // Add all sources with a prefix
            for (const [sourceId, sourceDef] of Object.entries(styleJson.sources)) {
                const newSourceId = `${sourceName}-${sourceId}`
                map.value.addSource(newSourceId, sourceDef)
            }

            // Add all layers, updating their source references and IDs
            styleJson.layers.forEach((layer) => {
                if (!layer.source) return
                const newLayer = {
                    ...layer,
                    id: `${sourceName}-${layer.id}`,
                    source: `${sourceName}-${layer.source}`,
                }
                map.value!.addLayer(newLayer)
            })
        } catch (err) {
            console.error('Failed to load external style:', err)
        }
    }

    const toggleMapLayer = (layerId: string, isVisible: boolean): void => {
        if (!map.value) return
        map.value.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none')
        if (isHatchSource(layerId) && isVisible) scheduleHatches()
    }

    const flyTo = (center: [number, number]): void => {
        map.value?.flyTo({
            center: center,
            essential: true,
        })
    }

    onUnmounted(() => {
        if (!map.value) return
        map.value.remove()
        map.value = null
    })

    return {
        map,
        initMap,
        toggleMapLayer,
        addExternalStyleLayers,
        flyTo,
    }
}
