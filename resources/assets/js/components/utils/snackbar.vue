<template>
    <v-snackbar v-model="snackbar" :timeout="message.time" :top="determinePositionY('top')" :bottom="determinePositionY('bottom')" :right="determinePositionX('right')" :left="determinePositionX('left')" :multi-line="true" :info="determineLabel('info')" :success="determineLabel('success')" :warning="determineLabel('warning')" :error="determineLabel('error')" :primary="determineLabel('primary')" :secondary="determineLabel('secondary')">
        {{ message.text }}
        <v-btn v-if="message.callback" flat dark @click.native="callbackAndClose">{{message.callback_label}}</v-btn>
    
        <v-btn v-if="message.close" flat dark @click.native="snackbar = false">CLOSE</v-btn>
    </v-snackbar>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import storeTypes from './../../store/types';

export default {
    computed: {
        snackbar: {
            get: function () {
                console.log(this.message);
                return this.showMessage
            },
            set: function (newValue) {
                this.clearMessage();
            }
        },
        ...mapGetters(storeTypes.snackbar.NAME, {
            showMessage: storeTypes.snackbar.GET_MESSAGE_VISIBILITY,
            message: storeTypes.snackbar.GET_MESSAGE,
        })

    },
    methods: {
        ...mapMutations(storeTypes.snackbar.NAME, {
            clearMessage: storeTypes.snackbar.CLEAR_SNACKBAR
        }),
        callbackAndClose() {
            this.message.callback();
            this.snackbar = false;
        },
        determinePositionX(pos) {
            return this.message.position.x === pos
        },
        determinePositionY(pos) {
            return this.message.position.y === pos
        },
        determineLabel(label) {
            return this.message.label === label
        }
    },
}
</script>

<style>

</style>
