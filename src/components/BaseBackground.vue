 <template>
    <div class="shade-wrapper  h-full w-full absolute">
        <div class="shade-01 h-full w-full absolute opacity-20"></div>
        <div class="shade-02 h-full w-full absolute opacity-60"></div>
        <div class="shade-03 h-full w-full absolute opacity-40"></div>
    </div>
 </template>

 
 <style scoped lang="scss">
 .shade-wrapper {
    z-index: -1;
 }
 .shade-01{
     background: radial-gradient(circle at 20% 80%, rgba(220, 220, 220, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(200, 200, 200, 0.7) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(230, 230, 230, 0.6) 0%, transparent 50%),
        radial-gradient(circle at 60% 80%, rgba(210, 210, 210, 0.9) 0%, transparent 50%),
        radial-gradient(circle at 90% 60%, rgba(190, 190, 190, 0.5) 0%, transparent 50%),
        radial-gradient(circle at 10% 30%, rgba(240, 240, 240, 0.7) 0%, transparent 50%),
        radial-gradient(circle at 70% 10%, rgba(205, 205, 205, 0.8) 0%, transparent 50%),
        radial-gradient(circle at 30% 90%, rgba(225, 225, 225, 0.6) 0%, transparent 50%),
        linear-gradient(135deg, #e5e5e5 0%, #d0d0d0 25%, #c8c8c8 50%, #d5d5d5 75%, #e0e0e0 100%);
 }
 .shade-02{
    background:
        radial-gradient(ellipse at 25% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 60%),
        radial-gradient(ellipse at 75% 75%, rgba(245, 245, 245, 0.8) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 90%, rgba(235, 235, 235, 0.7) 0%, transparent 60%),
        radial-gradient(ellipse at 85% 40%, rgba(250, 250, 250, 0.6) 0%, transparent 60%),
        radial-gradient(ellipse at 15% 70%, rgba(240, 240, 240, 0.8) 0%, transparent 60%);
 }
 .shade-03{
    background:
        radial-gradient(circle at 60% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 40%),
        radial-gradient(circle at 35% 70%, rgba(248, 248, 248, 0.4) 0%, transparent 40%),
        radial-gradient(circle at 80% 85%, rgba(252, 252, 252, 0.6) 0%, transparent 40%);
 }
 </style>
 