<template>
    <div class="container">
        <h1>Welcome to instagram</h1>
        <div>
            <router-link :to="{name: 'login'}">Login</router-link>
            <router-link :to="{name: 'register'}">Register</router-link>
            <router-link :to="{name: 'dash'}">Dashboard</router-link>
        </div>
    </div>
</template>

<script>
// import rSidebar from './layouts/sidebar';
// import rTopnav from './layouts/topnav';
// import rFooter from './layouts/footer';

export default {
    data: () => ({
        sidebar: true
    }),
    components: {
        // rSidebar,
        // rTopnav,
        // rFooter,
    }
}
</script>

<style lang="scss" scoped>
.fixed-top {
    position: fixed;
}

main#main {
    padding-top: 64px;
}
</style>
