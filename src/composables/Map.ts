import { ref, onUnmounted } from 'vue'
import { MAP_LAYERS, MAP_SOURCES, MAP_GLYPHS } from '@/constants/map'
import maplibregl, { Map, type MapOptions } from 'maplibre-gl'

const map = ref<Map | null>(null)

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
