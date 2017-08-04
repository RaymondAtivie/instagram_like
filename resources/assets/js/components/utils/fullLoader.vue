<template>
    <div class="wholepage" v-if="isFullLoading" fill-height>
        <v-layout align-center fill-height justify-center>
            <v-progress-circular indeterminate :size="size" :width='width' class="primary--text" @click="stopFullLoading" secondary></v-progress-circular>
        </v-layout>
    </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
    data(){
        return{
            size: 70,
            width: 5
        }
    },
    computed: {
        ...mapGetters([
            'isFullLoading'
        ])
    },
    methods: {
        ...mapMutations([
            'stopFullLoading'
        ])
    }
}
</script>

<style lang="stylus">
    .wholepage{
        position: fixed;
        background-color: transparentify(#fff, 0.8);
        width: 100%;
        height: 100%;
        top: 0px;
        z-index: 90;
    }
</style>
