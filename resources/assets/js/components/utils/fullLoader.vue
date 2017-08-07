<template>
    <transition name="scalein">
        <div class="wholepage" v-if="isFullLoading" fill-height>
            <v-layout align-center fill-height justify-center>
                <v-progress-circular indeterminate :size="size" :width='width' class="primary--text" @click="stopSiteLoading" secondary></v-progress-circular>
            </v-layout>
        </div>
    </transition>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import storeTypes from './../../store/types';

export default {
    data() {
        return {
            size: 70,
            width: 5
        }
    },
    computed: {
        ...mapGetters({
            'isFullLoading' : storeTypes.IS_FULL_LOADING
        })
    },
    methods: {
        ...mapMutations({
            'stopSiteLoading' : storeTypes.STOP_LOADING
        })
    }
}
</script>

<style lang="stylus">
    .wholepage{
        position: fixed;
        background-color: transparentify(#fff, 0.9);
        width: 100%;
        height: 100%;
        top: 0px;
        z-index: 90;
    }
    .scalein-leave-active, .scalein-enter-active {
        transition: all .2s;
    }
    .scalein-enter {
        opacity: 0;
        // transform: scale(3);
    }
    .scalein-leave-to {
        opacity: 0;
        // transform: scale(2);
    }
    // .scalein-leave-active {
    //     position: absolute;
    // }
</style>
