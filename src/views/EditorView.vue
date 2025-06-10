<template>
    <EditorLayout>
        <template #map>
            <BaseCard>
                <div id="map"></div>
            </BaseCard>
        </template>
        <template #options>
            <div class="option-form w-1/3">
                <BaseCard>
                    <h4>Map Filters</h4>

                    <BaseAdressAutoComplete @change="selectLocationMap" />
                    <div class="layer-form" v-for="layer in MAP_LAYERS" :key="layer.id">
                        <input
                            class="mx-2"
                            type="checkbox"
                            v-model="selectedLayer"
                            :value="layer.id"
                            :id="layer.id"
                        />
                        <label :for="layer.id">{{ layer.source }} - {{ layer.id }}</label>
                    </div>
                    <div class="flex justify-end">
                        <button
                            class="mx-2 my-4 px-4 py-1 cursor-pointer bg-blue-700 text-white rounded hover:bg-blue-600 transition"
                            @click="svg.exportSvg(queryFeatures)"
                        >
                            Export Svg
                        </button>
                    </div>
                </BaseCard>
            </div>
        </template>
    </EditorLayout>
</template>
<script lang="ts" setup>
import BaseCard from '@/components/Ui/BaseCard.vue'
import { ref, computed, onMounted, watch } from 'vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'
import { useSvgExport, type queryFeatures } from '@/composables/SvgExport'
import { MAP_LAYERS } from '@/constants/map'
import BaseAdressAutoComplete from '@/components/Ui/BaseAdressAutoComplete.vue'

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
const selectLocationMap = (place: AddressFeature) => {
    map.flyTo(place.center)
}

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
