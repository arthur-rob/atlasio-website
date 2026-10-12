<template>
    <div class="autocomplete">
        <BaseTextInput
            v-model="query"
            @input="fetchSuggestions"
            @keydown.down.prevent="moveDown"
            @keydown.up.prevent="moveUp"
            @keydown.enter.prevent="selectSuggestion(activeIndex)"
            placeholder="Enter address..."
        />

        <ul v-if="suggestions.length" class="suggestions" role="listbox">
            <li
                v-for="(suggestion, index) in suggestions"
                :key="suggestion.id"
                role="option"
                :aria-selected="index === activeIndex"
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
    width: 100%;
}
.suggestions {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    z-index: 10;
    width: 100%;
    max-height: 15rem;
    margin: 0;
    padding: 0.25rem;
    overflow-y: auto;
    list-style: none;
    background: var(--ui-surface);
    border: 1px solid var(--ui-border-color);
    border-radius: var(--ui-radius);
    box-shadow:
        0 10px 25px -10px rgb(0 0 0 / 0.15),
        0 2px 6px -2px rgb(0 0 0 / 0.06);
}
.suggestions li {
    padding: 0.5rem 0.75rem;
    border-radius: calc(var(--ui-radius) - 0.25rem);
    font-size: var(--ui-font-size);
    line-height: 1.35;
    color: var(--ui-text);
    cursor: pointer;
    transition: background-color 100ms ease;
}
.suggestions li.active,
.suggestions li:hover {
    background-color: var(--color-gray-100);
}
</style>
