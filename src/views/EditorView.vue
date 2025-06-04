<template>
    <EditorLayout>
        <template #map>
            <div id="map"></div>
        </template>
        <template #options>
            <div class="option-form">
                <div class="export" @click="map.exportSvg()">Export Me</div>
            </div>
        </template>
    </EditorLayout>
</template>
<script lang="ts" setup>
import EditorLayout from '@/layouts/EditorLayout.vue'
import { useMap } from '@/composables/Map'

const map = useMap('map')
</script>
<style>
#map {
    width: 420px;
    height: 594px;
}
</style>
