<template>
    <div id="top-loader">
        <v-progress-linear :active="isLoading" height="4" v-model="progress" :indeterminate="unknownProgress" class="ma-0" secondary></v-progress-linear>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import storeTypes from './../../store/types';

export default {
     data: () => ({
        // loader: true
        progress: null
    }),
    computed: {
        unknownProgress(){
            return !Number.isInteger(this.progress) ? true : false;
        },
        ...mapGetters({
            'isLoading': storeTypes.IS_LOADING
        })
    }
}
</script>
<style scoped>
    #top-loader{
        position: fixed;
        width: 100%;
        z-index: 10;
    }
</style>
