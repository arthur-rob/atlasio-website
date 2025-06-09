<template>
    <EditorLayout>
        <template #map>
            <div id="map"></div>
        </template>
        <template #options>
            <div class="option-form">
                <div class="layer-form" v-for="layer in MAP_LAYERS" :key="layer.id">
                    <input
                        type="checkbox"
                        v-model="selectedLayer"
                        :value="layer.id"
                        :id="layer.id"
                    />
                    <label :for="layer.id">{{ layer.source }} - {{ layer.id }}</label>
                </div>
                <div class="export" @click="svg.exportSvg(queryFeatures)">Export Svg</div>
            </div>
        </template>
    </EditorLayout>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'
import { useSvgExport, type queryFeatures } from '@/composables/SvgExport'
import { MAP_LAYERS } from '@/constants/map'

const map = useMap()
const svg = useSvgExport()
const selectedLayer = ref<string[]>(
    MAP_LAYERS.filter((el) => el.layout?.visibility !== 'none').map((el) => el.id),
)
const queryFeatures = computed<queryFeatures[]>(() => {
    return selectedLayer.value.map((layerId) => {
        const layer = MAP_LAYERS.find((el) => el.id === layerId)
        if (!layer) return
        return {
            tiles: layer.source,
            source: layer['source-layer'],
            filter: layer.filter,
        }
    })
})
watch(selectedLayer, (value) => {
    MAP_LAYERS.forEach((el) => {
        const isVisible = value.includes(el.id)
        map.toggleMapLayer(el.id, isVisible)
    })
})
onMounted(() => map.initMap('map'))
</script>
<style>
#map {
    width: 630px;
    height: 891px;
}
</style>
