<template>
     <v-card class="ma-3"> 
        <v-list class="py-0">
            <v-list-tile v-for="item in items" :key="item.title" @click="gotoPath(item.path)">
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
            { title: 'Home', icon: 'home', path: 'dash.home' },
            { title: 'Posts', icon: 'dashboard', path: 'dash.posts' }
        ],
    }),
    methods: {
        gotoPath(path){
            console.log(path);
            this.$router.push({ name: path});
        }
    }
}
</script>

<style>

</style>
