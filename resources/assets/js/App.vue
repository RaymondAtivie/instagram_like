<template>
        <v-app>
        <r-top-loader></r-top-loader>
        <r-full-loader></r-full-loader>
             <transition name="swipe" mode="out-in"> 
                <router-view keep-alive></router-view>
             </transition> 
        </v-app>
</template>

<script>
import topLoader from './components/utils/topLoader';
import fullLoader from './components/utils/fullLoader';
export default {
    components: {
        rTopLoader: topLoader,
        rFullLoader: fullLoader,
    }
}
</script>

<style lang="stylus" scoped>
.swipe-enter {
    opacity: 0;
}

.swipe-enter-active {
    // animation: moveFromBottom .2s forwards; 
    transition .3s all ease;
}

.fade-leave {
}

.swipe-leave-active {
    // animation: scaleDown .2s forwards;
    opacity: 0;
    transition .2s all ease;    
}

@keyframes scaleDown {
	from { }
	to { opacity: 0; transform: scale(.8); }
}
@keyframes scaleIn {
	from {opacity: 0; transform: scale(1.2); }
	to {  }
}
@keyframes moveFromBottom {
	from { transform: translateY(100%); }
}
</style>
