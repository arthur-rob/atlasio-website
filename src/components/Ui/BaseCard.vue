<template>
    <div class="base-card-wrapper bg-white/20 backdrop-blur-sm border-white/30">
        <slot></slot>
    </div>
</template>
<style scoped lang="scss">
.base-card-wrapper {
    box-sizing: border-box;
    padding: 10px;
    margin: 10px;
    background-color: rgba(255, 255, 255, 0.6);
    border: 1px solid white;
    border-radius: 8px;
}
</style>
