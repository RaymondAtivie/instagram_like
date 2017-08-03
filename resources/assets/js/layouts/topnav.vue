<template>
    <div>
        <v-toolbar-side-icon @click.native.stop="sideBar = !sideBar" class="hidden-md-and-up"></v-toolbar-side-icon>
        <v-toolbar-title>Kelly Instagramr</v-toolbar-title>
    </div>
</template>

<script>
export default {
    data: () => ({
        sideBar: true, 
    }),
}
</script>

<style scoped>

</style>
