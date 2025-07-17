<template>
    <EditorLayout>
        <template #map>
            <div id="map" :class="[{ 'fade-out': !isMapLoaded }]"></div>
        </template>
        <template #options>
            <div class="option-form w-1/2 p-4 bg-white rounded-md drop-shadow-2xl">
                <BaseCard>
                    <div v-if="stepIndex == 1">
                        <h2>Étape 1</h2>
                        <p class="text-subtitle color-gray-400">Entrer une adresse ou zoomer sur la carte</p>
                        <BaseAdressAutoComplete class="w-full" @change="selectLocationMap" />
                        <div class="flex justify-end">
                            <BaseButton
                                    append-icon="arrow_right_alt"
                                    @click="stepIndex++"
                                    >Suivant</BaseButton
                                >
                        </div>
                   </div>
                   <div v-if="stepIndex == 2">
                        <h2>Étape 2 </h2>
                        <p class="text-subtitle color-gray-400"> Sélectionnez les couches à afficher</p>
                        <MapFilter class="layer-form" v-for="labelObj in MAP_LAYERS_LABELS" :key="labelObj.label" :label="labelObj.label" :layerKeys="labelObj.layer_keys" v-model="selectedLayer"/>
                        <div class="flex justify-between">
                            <BaseButton
                                variant="plain"
                                @click="stepIndex--"
                                >Retour</BaseButton
                            >
                            <BaseButton
                                append-icon="arrow_right_alt"
                                @click="svg.exportSvg(queryFeatures)"
                                >Generate</BaseButton
                            >
                        </div>
                    </div>
                </BaseCard>
            </div>
        </template>
    </EditorLayout>
</template>
<script lang="ts" setup>
import BaseButton from '@/components/Ui/BaseButton.vue'
import BaseCard from '@/components/Ui/BaseCard.vue'
import MapFilter from '@/components/MapFilter.vue'
import { ref, computed, onMounted, watch } from 'vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'
import { useSvgExport, type queryFeatures } from '@/composables/SvgExport'
import { MAP_LAYERS, MAP_LAYERS_LABELS } from '@/constants/map'
import BaseAdressAutoComplete from '@/components/Ui/BaseAdressAutoComplete.vue'

const map = useMap()
const svg = useSvgExport()
const isMapLoaded = ref(false)
const stepIndex = ref(1)
const selectedLayer = ref<string[]>(
    MAP_LAYERS.filter((el) => el.layout?.visibility !== 'none').map((el) => el.id),
)
const queryFeatures = computed<queryFeatures[]>(() => {
    return selectedLayer.value
        .map((layerId) => {
            const layer = MAP_LAYERS.find((el) => el.id === layerId)
            if (!layer) return undefined
            return {
                tiles: (layer as any).source,
                source: (layer as any)['source-layer'],
                filter: (layer as any).filter,
            }
        })
        .filter((f): f is any => !!f)
})

const selectLocationMap = (place: AddressFeature) => {
    map.flyTo(place.center)
    stepIndex.value = 2
}

watch(selectedLayer, (value) => {
    MAP_LAYERS.forEach((el) => {
        const isVisible = value.includes(el.id)
        map.toggleMapLayer(el.id, isVisible)
    })
})
onMounted(async () => {
    await map.initMap('map')
    /* await map.addExternalStyleLayers(
        `https://api.maptiler.com/maps/basic-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
        'basic',
    ) */
    isMapLoaded.value = true
})
</script>
<style scoped lang="scss">
.option-form {
    z-index: 10;
}
#map {
    position: absolute;
    z-index: 0;
    width: 100%;
    height: 100vh;
    opacity: 1;
    transition: opacity 1s ease-in-out;
}
#map.fade-out {
    opacity: 0;
}
</style>
