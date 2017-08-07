<template>
    <v-card class="post-card mb-5">
    
        <v-system-bar status class="info" dark v-if="post.report">
            <v-icon>report</v-icon>
            This has been reported to the police
            <v-spacer></v-spacer>
            <v-icon>location_on</v-icon>
            <span>Agege</span>
        </v-system-bar>
    
        <v-card-actions class="ma-0 pa-0">
            <r-user-top :user="post.user"></r-user-top>
            <v-spacer></v-spacer>
            <v-menu bottom right>
                <v-btn icon slot="activator">
                    <v-icon>more_vert</v-icon>
                </v-btn>
                <v-list>
                    <v-list-tile @click.native="remove">
                        <v-list-tile-content>
                            <v-list-tile-title class="error--text">Delete</v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-icon class="error--text">delete</v-icon>
                        </v-list-tile-action>
                    </v-list-tile>
                    <v-list-tile>
                        <v-list-tile-content>
                            <v-list-tile-title class="info--text">Report</v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-icon class="info--text">report</v-icon>
                        </v-list-tile-action>
                    </v-list-tile>
                </v-list>
            </v-menu>
        </v-card-actions>
    
        <v-card-media v-if="post.media" :src="post.media" height="300px"></v-card-media>
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
                <!-- {{ post.comments.length > 1 ? post.comments.length : '' }} -->
                <v-icon>comment</v-icon>
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
    data() {
        return {
            isCommentOpen: false
        }
    },
    methods: {
        remove(){
            this.$emit('remove', this.post.id);
        },
        report(){

        }
    }
}
</script>

<style lang="stylus" scoped>
.post-card{
    width: 100%;
    min-width: 400px;
}
</style>
