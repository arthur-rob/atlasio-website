import { ref, onUnmounted } from 'vue'
import { MAP_LAYERS, MAP_SOURCES } from '@/constants/map'
import maplibregl, { Map, type MapOptions } from 'maplibre-gl'

const map = ref<Map | null>(null)

export function useMap() {
    const initMap = (containerId: string, options?: MapOptions) => {
        map.value = new maplibregl.Map({
            container: containerId,
            style: {
                version: 8,
                sources: MAP_SOURCES,
                layers: MAP_LAYERS,
                glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
            },
            center: [5.420586, 43.210837],
            zoom: 14,
            ...options,
        })
    }

    const toggleMapLayer = (layerId: string, isVisible: boolean) => {
        if (!map.value) return
        map.value.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none')
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
    }
}
