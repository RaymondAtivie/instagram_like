<template>
    <v-layout class="py-0" wrap row>
        <template v-for="(post, i) in posts">
            <v-flex xs12 :key="i">
                <r-post :post="post" :key="i" class="mb-5"></r-post>
            </v-flex>
        </template>
    </v-layout>
</template>

<script>
import Post from './Post';
export default {
    props: ['posts'],
    components: {
        rPost: Post
    }
}
</script>

<style lang="stylus">
</style>