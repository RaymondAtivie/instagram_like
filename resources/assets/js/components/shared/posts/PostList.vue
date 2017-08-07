<template>
    <div>
        <v-layout class="py-0" row wrap>
            <transition-group name="list">
                <v-flex xs12 md12 v-for="(post, i) in posts" :key="post.id">
                    <r-post :post="post" class="mb-5" @remove="removePost"></r-post>
                </v-flex>
            </transition-group>
        </v-layout>
    </div>
</template>

<script>
import Post from './Post';
export default {
    props: ['posts'],
    components: {
        rPost: Post
    },
    methods: {
        removePost(p){
            this.posts.forEach((post, index) => {
                if(post.id == p){
                    this.posts.splice(index, 1);
                    return;
                }   
            });
        }
    }
}
</script>

<style lang="stylus">
.list-enter-active {
  transition: all .3s .6s;
}
.list-leave-active {
  transition: all .3s;
}
.list-enter, .list-leave-to {
//   opacity: 0;
  transform: translateX(1300px);
}
.list-move {
  transition: transform .3s .3s;
}
.list-leave-active {
  position: absolute;
}
</style>