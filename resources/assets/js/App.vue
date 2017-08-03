
<template>
    <v-app>
        <v-navigation-drawer v-model="sidebar" persistent floating>
            <r-sidebar></r-sidebar>
        </v-navigation-drawer>
        <v-toolbar class="fixed-top">
            <r-topnav></r-topnav>
        </v-toolbar>
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
import rSidebar from './layouts/sidebar';
import rTopnav from './layouts/topnav';
import rFooter from './layouts/footer';

export default {
    data: () => ({
        sidebar: true
    }),
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
