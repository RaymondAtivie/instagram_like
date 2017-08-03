
<template>
    <v-app>
        <router-view></router-view> 
    </v-app>
</template>

<script>

export default {
    data: () => ({
        sidebar: true
    })
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
