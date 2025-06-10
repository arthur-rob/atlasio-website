<template>
    <div class="autocomplete my-2">
        <BaseTextInput
            v-model="query"
            @input="fetchSuggestions"
            @keydown.down.prevent="moveDown"
            @keydown.up.prevent="moveUp"
            @keydown.enter.prevent="selectSuggestion(activeIndex)"
            placeholder="Enter address..."
        />

        <ul v-if="suggestions.length" class="suggestions">
            <li
                v-for="(suggestion, index) in suggestions"
                :key="suggestion.id"
                :class="{ active: index === activeIndex }"
                @mousedown.prevent="selectSuggestion(index)"
            >
                {{ suggestion.place_name }}
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseTextInput from './BaseTextInput.vue'

const query = ref<string>('')
const suggestions = ref<AddressFeature[]>([])
const activeIndex = ref<number>(-1)
const debounceTimeout = ref<number>()
const emit = defineEmits<{
    (e: 'change', value: string): void
}>()

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY

const buildParams = () => {
    const queryParams = new URLSearchParams()
    queryParams.append('access_token', MAPBOX_TOKEN)
    queryParams.append('autocomplete', 'true')
    queryParams.append('limit', 5)
    queryParams.append('types', 'address,place')
    queryParams.append('country', 'fr')

    return queryParams.toString()
}

async function fetchSuggestions() {
    if (query.value.length < 3) return
    clearTimeout(debounceTimeout.value)
    if (!query.value) {
        suggestions.value = []
        return
    }

    debounceTimeout.value = setTimeout(async () => {
        const params = buildParams()
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.value)}.json?${params}`
        const response = await fetch(url)
        const data = await response.json()
        suggestions.value = data.features || []
        activeIndex.value = -1
    }, 300)
}

function moveDown() {
    if (activeIndex.value < suggestions.value.length - 1) {
        activeIndex.value++
    }
}

function moveUp() {
    if (activeIndex.value > 0) {
        activeIndex.value--
    }
}

function selectSuggestion(index) {
    const selected = suggestions.value[index]
    if (selected) {
        query.value = selected.place_name
        emit('change', selected)
        suggestions.value = []
    }
}
</script>

<style scoped>
.autocomplete {
    position: relative;
    width: 300px;
}
input {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}
.suggestions {
    list-style: none;
    padding: 0;
    margin: 0;
    background: white;
    border: 1px solid #ccc;
    border-top: none;
    max-height: 200px;
    overflow-y: auto;
    position: absolute;
    width: 100%;
    z-index: 10;
}
.suggestions li {
    padding: 8px;
    cursor: pointer;
}
.suggestions li.active,
.suggestions li:hover {
    background-color: #f0f0f0;
}
</style>
