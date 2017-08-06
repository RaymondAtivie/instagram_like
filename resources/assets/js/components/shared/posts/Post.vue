<template>
    <v-card class="post-card mb-5">
        <r-user-top :user="post.user"></r-user-top>
        <v-card-media v-if="post.media" :src="post.media.link" height="300px"></v-card-media>
        <v-divider v-else inset></v-divider>
        <v-card-title primary-title>
            <div>
                <span>
                    {{post.text}}
                </span>
            </div>
        </v-card-title>
        <v-card-actions class="primary">
            <v-btn flat dark icon class="mx-2">
                {{ post.likes > 1 ? post.likes : '' }}
                <v-icon>favorite</v-icon>
            </v-btn>
            <v-btn flat dark icon class="mx-2">
                {{ post.reposts > 1 ? post.reposts : '' }}
                <v-icon>repeat</v-icon>
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn dark icon @click.native="isCommentOpen = !isCommentOpen" class="mx-3">
                {{ post.comments.length > 1 ? post.comments.length : '' }} 
                <v-icon>chat</v-icon>
            </v-btn>
        </v-card-actions>
        <transition name="fade">
            <v-card-text v-show="isCommentOpen" class="comment-box pa-0">
                <r-comment-list :comments="post.comments"></r-comment-list>
            </v-card-text>
        </transition>
    </v-card>
</template>

<script>
import UserSmallProfile from './../users/UserSmallProfile';
import CommentList from './../comments/CommentList';
export default {
    props: ['post'],
    components: {
        rUserTop: UserSmallProfile,
        rCommentList: CommentList
    },
    data(){
        return{
            isCommentOpen: false
        }
    }
}
</script>

<style>

</style>
