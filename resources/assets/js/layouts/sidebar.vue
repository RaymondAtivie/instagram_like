<template>
     <v-card class="ma-3"> 
        <v-list class="py-0">
            <v-list-tile v-for="item in items" :key="item.title" @click="gotoPath(item.route)">
                <v-list-tile-action>
                    <v-icon>{{ item.icon }}</v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                    <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
     </v-card> 
</template>

<script>
export default {
    data: () => ({
        items: [
            { title: 'Home', icon: 'home', route: 'dash.home' },
            { title: 'Posts', icon: 'dashboard', route: 'dash.posts' },
            { title: 'Messages', icon: 'chat', route: 'dash.messages' }
        ],
    }),
    methods: {
        gotoPath(path){
            this.$router.push({ name: path});
        }
    }
}
</script>

<style>

</style>
