<template>
    <div class="grey lighten-2">
        <v-layout align-center>
            <v-flex class="hidden-xs-only">
                <v-list-tile-avatar>
                    <img :src="userImage">
                </v-list-tile-avatar>
            </v-flex>
            <v-flex xs8>
                <v-text-field class="pb-0" v-model="commentInput" auto-grow label="write a comment" full-width multi-line rows="2"></v-text-field>
            </v-flex>
            <v-flex class="text-xs-center">
                <v-btn fab dark small class="primary">
                    <v-icon dark>send</v-icon>
                </v-btn>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
export default {
    props: ['userImage'],
    data(){
        return{
            commentInput: ''
        }
    }
}
</script>
