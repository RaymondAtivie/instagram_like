
<template>
    <v-app>
        <v-navigation-drawer v-model="sidebar" persistent floating>
            <r-sidebar></r-sidebar>
        </v-navigation-drawer>

        <r-topnav class="fixed-top" @toggleSidebar="sideBarToggle"></r-topnav>

        <main id="main">
            <v-container fluid>
                <router-view></router-view> 
            </v-container>
        </main>
        <v-footer>
            <r-footer></r-footer>
        </v-footer>
    </v-app>
</template>

<script>
import rSidebar from './../../layouts/sidebar';
import rTopnav from './../../layouts/topnav';
import rFooter from './../../layouts/footer';

export default {
    data: () => ({
        sidebar: true
    }),
    methods: {
        sideBarToggle() {
            this.sidebar = !this.sidebar;
        }
    },
    components:{
        rSidebar,
        rTopnav,
        rFooter,
    }
}
</script>

<style lang="scss" scoped>
    .fixed-top{
        position: fixed;
    }
    main#main{
        padding-top: 64px;
    }
</style>
