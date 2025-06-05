<template>
    <EditorLayout>
        <template #map>
            <div id="map"></div>
        </template>
        <template #options>
            <div class="option-form">
                <div class="layer-form" v-for="(layer) in MAP_LAYERS">
                    <input type="checkbox" v-model="selectedLayer" :value="layer.id">
                        {{ layer.source }} - {{ layer['source-layer'] }}
                    </input>
                </div>
                <div class="export" @click="svg.exportSvg(queryFeatures)">Export Svg</div>
            </div>
        </template>
    </EditorLayout>
</template>
<script lang="ts" setup>
import { ref,computed, onMounted } from 'vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'
import { useSvgExport, queryFeatures } from '@/composables/SvgExport'
import { MAP_LAYERS } from '@/constants/map'

const map = useMap()
const svg = useSvgExport()
const selectedLayer = ref<string[]>([])
const queryFeatures = computed<queryFeatures[]>(() => {
    return selectedLayer.value.map(layerId => {
        const layer = MAP_LAYERS.find(el => el.id === layerId)
        return {
            tiles: layer.source,
            source: layer['source-layer'],
            filter: layer.filter
        }
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
