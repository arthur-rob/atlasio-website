<template>
    <div class="base-card-wrapper bg-white/20 backdrop-blur-sm">
        <slot></slot>
    </div>
</template>
<style scoped lang="scss">
.base-card-wrapper {
    box-sizing: border-box;
    padding: 10px;
    margin: 10px;
    border: 1px solid white;
    border-radius: 8px;
}
</style>
