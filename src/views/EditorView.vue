<template>
    <EditorLayout>
        <template #map>
            <div id="map" :class="[{ 'fade-out': !isMapLoaded }]"></div>
        </template>
        <template #options>
            <div class="option-form w-1/3 p-4 bg-white rounded-md drop-shadow-2xl items-center">
                <BaseCard>
                    <div v-if="stepIndex == 1">
                        <h2>Étape 1</h2>
                        <p class="text-subtitle text-gray-400">
                            Entrer une adresse ou zoomer sur la carte
                        </p>

                        <div class="flex justify-end items-start mt-2">
                            <BaseAdressAutoComplete class="w-full" @change="selectLocationMap" />
                            <BaseButton
                                class="ml-2"
                                append-icon="arrow_right_alt"
                                @click="stepIndex++"
                            />
                        </div>
                        <BaseDivider class="my-2" />
                        <p class="text-subtitle text-gray-400">
                            Importer une activité depuis strava
                        </p>
                        <div
                            class="strava bg-orange-600 rounded w-full align-text-center cursor-pointer my-4"
                            @click="connectStrava"
                            v-if="!stravaToken"
                        >
                            <p class="text-white text-center pa-2">Se Connecter</p>
                        </div>
                        <div v-if="stravaActivities.length > 0">
                            <p class="text-subtitle text-gray-400">Activités</p>
                            <div v-for="activity in stravaActivities" :key="activity.id" class=" ">
                                <p>{{ activity.type }}</p>
                                <div class="flex justify-between items-center">
                                    <p>{{ displayDate(activity.start_date) }}</p>
                                    <p>{{ displayAverageSpeed(activity) }}</p>
                                    <p>{{ Math.round(activity.distance / 1000) }} km</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="stepIndex == 2">
                        <h2>Étape 2</h2>
                        <p class="text-subtitle text-gray-400">
                            Sélectionnez les couches à afficher
                        </p>
                        <MapFilter
                            class="layer-form"
                            v-for="labelObj in MAP_LAYERS_LABELS"
                            :key="labelObj.label"
                            :label="labelObj.label"
                            :layerKeys="labelObj.layer_keys"
                            v-model="selectedLayer"
                        />
                        <div class="flex justify-between">
                            <BaseButton variant="plain" @click="stepIndex--">Retour</BaseButton>
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
import BaseDivider from '@/components/Ui/BaseDivider.vue'
import MapFilter from '@/components/MapFilter.vue'
import { ref, computed, onMounted, watch } from 'vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'
import { useSvgExport, type queryFeatures } from '@/composables/SvgExport'
import { MAP_LAYERS, MAP_LAYERS_LABELS } from '@/constants/map'
import BaseAdressAutoComplete from '@/components/Ui/BaseAdressAutoComplete.vue'
import axios from 'axios'
import type { AddressFeature } from '@/types/map'
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

const map = useMap()
const stravaToken = ref(localStorage.getItem('strava_token'))
const stravaActivities = ref([])
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
                tiles: (layer as FillLayerSpecification | LineLayerSpecification).source,
                source: (layer as FillLayerSpecification | LineLayerSpecification)['source-layer'],
                filter: (layer as FillLayerSpecification | LineLayerSpecification).filter,
            }
        })
        .filter((f): f is any => !!f)
})

const selectLocationMap = (place: AddressFeature) => {
    map.flyTo(place.center)
    stepIndex.value = 2
}

const connectStrava = async () => {
    const popup = window.open(
        `${import.meta.env.VITE_API_BASE_URL}/strava/auth`,
        'stravaAuth',
        'width=500,height=600',
    )

    window.addEventListener('message', (event) => {
        if (event.origin !== 'http://localhost:3000') return // sécurité

        const token = event.data?.token
        if (token) {
            // Utiliser le token pour récupérer les activités
            localStorage.removeItem('strava_token')
            localStorage.setItem('strava_token', token)
            fetchActivities(token)
        }
    })
}
const displayDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}
const displayAverageSpeed = (activity: StravaActivity) => {
    const averageTimePerKm = Math.round(1000 / activity.average_speed)
    const averageMinPerKm = Math.floor(averageTimePerKm / 60)
    const averageSecPerKm = averageTimePerKm % 60
    return `${averageMinPerKm}:${averageSecPerKm} min/km`
}
const fetchActivities = async (token: string) => {
    const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/strava/activities`, {
        params: { token },
    })
    stravaActivities.value = data
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

    if (stravaToken.value) fetchActivities(stravaToken.value)
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
