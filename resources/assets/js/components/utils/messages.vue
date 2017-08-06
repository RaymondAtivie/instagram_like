<template>
    <v-snackbar 
        v-model="snackbar" 
        :timeout="message.time" 

        :top="determinePositionY('top')"
        :bottom="determinePositionY('bottom')"
        :right="determinePositionX('right')"
        :left="determinePositionX('left')"

        :multi-line="true" 
        :info="determineLabel('info')" 
        :success="determineLabel('success')" 
        :warning="determineLabel('warning')" 
        :error="determineLabel('error')" 
        :primary="determineLabel('primary')" 
        :secondary="determineLabel('secondary')"
        >
        {{ message.text }}
        <v-btn v-if="message.callback" flat dark @click.native="callbackAndClose">{{message.callback_label}}</v-btn> 

        <v-btn v-if="message.close" flat dark @click.native="snackbar = false">CLOSE</v-btn> 
    </v-snackbar>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
export default {
    computed: {
        snackbar: {
            get: function () {
                return this.showMessage
            },
            set: function (newValue) {
                this.clearMessage();
            }
        },
        ...mapGetters('messages', {
            showMessage: 'showMessage',
            message: 'message'
        })
        
    },
    methods: {
        ...mapMutations('messages', [
            'clearMessage'
        ]),
        callbackAndClose(){
            this.message.callback();
            this.snackbar = false;
        },
        determinePositionX(pos){
            return this.message.position.x === pos
        },
        determinePositionY(pos){
            return this.message.position.y === pos
        },
        determineLabel(label){
            return this.message.label === label
        }
    },
}
</script>

<style>

</style>
