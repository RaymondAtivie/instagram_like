<template>
    <v-list two-line class="py-0">
        <v-list-tile avatar>
            <v-list-tile-avatar>
                <img :src="user.image">
            </v-list-tile-avatar>
            <v-list-tile-content>
                <v-list-tile-title>{{user.name}}</v-list-tile-title>
                <v-list-tile-sub-title>{{user.title}}</v-list-tile-sub-title>
                <small class="time">2 minutes ago</small>
            </v-list-tile-content>
        </v-list-tile>
    </v-list>
</template>

<script>
export default {
    props: ['user'],
    data() {
        return{
            name
        }
    }
}
</script>


<style>
small.time{
    color: silver
}
</style>

