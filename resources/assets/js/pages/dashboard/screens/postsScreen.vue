<template>
    <div>
        <v-layout class="mb-3" justify-center>
            <v-flex xs12 sm8 md6 lg5>
                <div class="headline">Posts</div>
            </v-flex>
        </v-layout>
    
        <v-layout wrap justify-center>
            <v-flex xs12 sm8 md6 lg5>
                <r-posts :posts="posts"></r-posts>
            </v-flex>
        </v-layout>
    
        <div class="fab-holder">
            <v-btn @click.native.stop="openNewPost" dark fab class="primary" v-tooltip:top="{ html: 'new post' }">
                <v-icon>add</v-icon>
            </v-btn>
        </div>
    
        <v-dialog v-model="newPostModal" width="600px">
            <r-add-post :clear="clearNewPost" userImage="/images/avatar1.jpg" @canceled="newPostModal = false" @posted="addPost"></r-add-post>
        </v-dialog>
    
    </div>
</template>

<script>
import Posts from '@/components/shared/posts/PostList'
import AddPost from '@/components/shared/posts/AddPost'
import { mapGetters } from 'vuex';
import pApi from './../../../api/posts';
import types from './../../../store/types';

export default {
    components: {
        rPosts: Posts,
        rAddPost: AddPost,
    },
    data() {
        return {
            show: false,
            // posts: [],
            newPostModal: false,
            counter: 3
        }
    },
    computed: {
        clearNewPost() {
            return this.newPostModal;
        },
        ...mapGetters(types.post.NAME, {
            posts: types.post.GET_POSTS
        })
    },
    methods: {
        openNewPost() {
            this.newPostModal = true;
        },
        addPost(newPost) {
            pApi.addPost(newPost)
                .then(res => {
                    this.newPostModal = false;
                    this.closeAddPost = true;
                })
        }
    },
    mounted() {
        pApi.getAll()
            .catch(error => {
                console.log("erroring");
                console.log(error);
            })
    }
}
</script>

<style lang='stylus'>
.fab-holder{
    position: fixed;
    z-index: 20;
    bottom: 30px;
    right: 30px;
    @media only screen and (min-width: 1025px){
        right: 150px;
    }
}
.comment-box{
    max-height: 500px;
    overflow: hidden;
}
	
.fade-enter-active 
	transition max-height .2s ease-in

.fade-leave-active
	transition max-height .2s ease-out

.fade-enter, .fade-leave-active
	max-height 0px

</style>
