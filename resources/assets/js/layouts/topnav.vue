<template>
    <v-toolbar dark class="primary">
        <v-toolbar-side-icon @click.native.stop="sideBarToggle"></v-toolbar-side-icon>
        <v-toolbar-title @click="gotoHome" class="clickable">Vumen Dashboard</v-toolbar-title>
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

export default {
    data: () => ({
        sideBar: true,
    }),
    computed: {
        ...mapGetters([
            'isLoading',
            'isFullLoading',
        ])
    },
    methods: {
        gotoHome(){
            this.$router.push({name: 'index'});
        },
        sideBarToggle() {
            this.$emit('toggleSidebar');
        },
        logout() {
            this.dispatchLogout();
            this.$router.push({ name: 'index'});
        },
        toggleSiteLoad(){
            this.isLoading ? this.stopSiteLoading() : this.startSiteLoading();
        },
        toggleFullLoad(){
            this.isFullLoading ? this.stopFullLoading() : this.startFullLoading();
        },
        ...mapActions('auth', {
            dispatchLogout: 'logout'
        }),
        ...mapMutations([
            'startSiteLoading',
            'stopSiteLoading',
            'startFullLoading',
            'stopFullLoading',
        ])
    }
}
</script>

<style scoped>

</style>
