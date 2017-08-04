
<template>
    <v-app>
        <v-navigation-drawer v-model="sideBarOpen" persistent floating class="secondary darken-3">
            <r-sidebar></r-sidebar>
        </v-navigation-drawer>

        <r-topnav class="fixed-top" @toggleSidebar="sideBarToggle"></r-topnav>

        <main id="main">
            <v-container fluid>
                <transition name="fade" mode="out-in">
                    <router-view></router-view> 
                </transition>
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

import store from './../../store/store';

export default {
    data: () => ({
        sideBarOpen: true
    }),
    methods: {
        sideBarToggle() {
            this.sideBarOpen = !this.sideBarOpen;
        }
    },
    components:{
        rSidebar,
        rTopnav,
        rFooter,
    },
    beforeRouteEnter(to, from, next) {
        console.log(store);
        next();
    }
}
</script>

<style lang="stylus" scoped>
    .fixed-top{
        position: fixed;
    }
    main#main{
        padding-top: 64px;
    }

    .fade-enter {
        opacity: 0;
        transform: translate(-30px);
    }

    .fade-enter-active {
        transition: all .2s ease;
    }

    .fade-leave {
        /* opacity: 0; */
    }

    .fade-leave-active {
        transition: all .2s ease;
        opacity: 0;
        transform: translate(30px);
    }
</style>
