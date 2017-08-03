<template>
    <v-toolbar>
        <v-toolbar-side-icon @click.native.stop="sideBarToggle"></v-toolbar-side-icon>
        <v-toolbar-title>Kelly Instagramr</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
            <v-btn flat>
              <v-icon class="red--text">input</v-icon>
            </v-btn>
        </v-toolbar-items>
    </v-toolbar>
</template>

<script>
export default {
    data: () => ({
        sideBar: true,
    }),
    methods: {
        sideBarToggle(){
            this.$emit('toggleSidebar');
        }
    }
}
</script>

<style scoped>

</style>
