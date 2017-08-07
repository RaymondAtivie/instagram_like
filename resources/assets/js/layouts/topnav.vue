<template>
    <v-toolbar dark class="primary">
        <v-toolbar-side-icon @click.native.stop="sideBarToggle"></v-toolbar-side-icon>
        <v-toolbar-title @click="gotoHome" class="clickable">
            Community Watch
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
            <v-btn flat @click="toggleFullLoad">
                <v-icon>mdi-reload</v-icon>
            </v-btn>
            <v-btn flat @click="toggleSiteLoad">
                <v-icon>mdi-loop</v-icon>
            </v-btn>
            <v-btn flat @click="logout">
                <v-icon>mdi-logout</v-icon>
            </v-btn>
        </v-toolbar-items>
    </v-toolbar>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import storeTypes from './../store/types';

export default {
    data: () => ({
        sideBar: true,
    }),
    computed: {
        ...mapGetters({
            'isLoading': storeTypes.IS_LOADING,
            'isFullLoading': storeTypes.IS_FULL_LOADING,
        })
    },
    methods: {
        gotoHome() {
            this.$router.push({ name: 'index' });
        },
        sideBarToggle() {
            this.$emit('toggleSidebar');
        },
        logout() {
            this.dispatchLogout();
            this.$router.push({ name: 'index' });
        },
        toggleSiteLoad() {
            this.isLoading ? this.stopSiteLoading() : this.startSiteLoading();
        },
        toggleFullLoad() {
            this.isFullLoading ? this.stopSiteLoading() : this.startSiteLoading('full');
        },
        ...mapActions(storeTypes.auth.NAME, {
            dispatchLogout: 'logout'
        }),
        ...mapMutations({
            'startSiteLoading': storeTypes.START_LOADING,
            'stopSiteLoading': storeTypes.STOP_LOADING,
        })
    }
}
</script>

<style scoped>

</style>
