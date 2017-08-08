<template>
     <v-card class="ma-3 leftPlace"> 
        <v-list class="py-0">
            <v-list-tile v-model="item.active" v-for="item in items" :key="item.title" @click="gotoPath(item)">
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
            { title: 'Home', icon: 'home', route: 'dash.home', active: true },
            { title: 'Posts', icon: 'dashboard', route: 'dash.posts', active: false },
            { title: 'Messages', icon: 'chat', route: 'dash.messages', active: false }
        ],
    }),
    computed: {
        
    },
    methods: {
        gotoPath(item){
            this.clearActives();
            item.active = true;
            console.log(item);
            this.$router.push({ name: item.route});
        },
        clearActives(){
            this.items.forEach(function(item) {
                item.active = false
            }, this);
        }
    },
    mounted(){
        console.log(this.$router.currentRoute);
    }
}
</script>

<style lang="stylus">
// .leftPlace{
    .list__tile--active{
        color: red !important;
        i{
            color: red !important;
        }
    }
// }
</style>
