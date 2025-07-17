<template>
    <div>
        <slot name="map"></slot>
        <div class="editor-container mx-auto p-4 flex justify-start items-start w-4/5 max-w-4xl ">
            <slot name="options"></slot>
        </div>
    </div>
</template>
<style scoped>
.editor-container{
    margin-top: var(--menu-height, 64px);
    height: calc(100vh - var(--menu-height, 64px));
}
</style>
