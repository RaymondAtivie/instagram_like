<template>
    <div>
        <v-layout class="mb-3" justify-center>
            <v-flex xs12 sm8 md5>
                <div class="headline">Posts</div>
            </v-flex>
        </v-layout>
    
        <v-layout wrap justify-center>
            <v-flex xs12 sm8 md6 lg5>
                <r-posts :posts="posts"></r-posts>
            </v-flex>
        </v-layout>
    
        <div class="fab-holder">
            <v-btn @click.native.stop="openNewPost" dark fab class="primary"v-model="fab" v-tooltip:top="{ html: 'new post' }">
                <v-icon>add</v-icon>
            </v-btn>
        </div>
    
    </div>
</template>

<script>
import Posts from '@/components/shared/posts/PostList'
export default {
    data() {
        return {
            show: false,
            posts: [{
                user: {
                    name: 'Raymond Ativie',
                    title: 'Developer and Vuejs evangelist @ Reftek.co',
                    image: '/images/avatar.jpg'
                },
                time: 12434355,
                isLiked: false,
                text: "loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum nisi soluta eos. Dolorum quo molestias voluptatem sapiente voluptatum. Quisquam expedita est doloremque ea neque. Voluptatem vero accusamus accusamus.",
                isCommentOpen: false,
                likes: 0,
                reposts: 3,
                comments: [{
                    user: {
                        name: 'Kelly Ezeh',
                        title: 'Developer and Vuejs evangelist @ Reftek.co',
                        image: '/images/avatar1.jpg'
                    },
                    comment: 'loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earumoremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earumoremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum',
                    date: '12 March 2017'
                },
                {
                    user: {
                        name: 'Raymond Ativie',
                        title: 'Developer and Vuejs evangelist @ Reftek.co',
                        image: '/images/avatar.jpg'
                    },
                    comment: 'loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum',
                    date: '12 March 2017'
                }],
                // media: {
                //     type: 'image',
                //     link: '/images/image1.jpg',
                // }
                media: null
            },
            {
                user: {
                    name: 'Kelly Ezeh',
                    title: 'Masters computer science',
                    image: '/images/avatar1.jpg'
                },
                time: 12434355,
                isLiked: false,
                text: "loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum nisi soluta eos. Dolorum quo molestias voluptatem sapiente voluptatum. Quisquam expedita est doloremque ea neque. Voluptatem vero accusamus accusamus.",
                isCommentOpen: false,
                likes: 0,
                reposts: 3,
                comments: [{
                    user: {
                        name: 'Raymond Ativie',
                        title: 'Developer and Vuejs evangelist @ Reftek.co',
                        image: '/images/avatar.jpg'
                    },
                    comment: 'loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earumoremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earumoremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum',
                    date: '12 March 2017'
                },
                {
                    user: {
                        name: 'Kelly Ezeh',
                        title: 'Developer and Vuejs evangelist @ Reftek.co',
                        image: '/images/avatar1.jpg'
                    },
                    comment: 'loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum',
                    date: '12 March 2017'
                }],
                media: {
                    type: 'image',
                    link: '/images/image1.jpg',
                }
            }],
            fab: false
        }
    },
    components: {
        rPosts: Posts
    },
    computed: {
        activeFab() {
            switch (this.tabs) {
                case 'one': return { 'class': 'purple', icon: 'account_circle' }
                case 'two': return { 'class': 'red', icon: 'edit' }
                case 'three': return { 'class': 'green', icon: 'keyboard_arrow_up' }
                default: return {}
            }
        }
    },
    methods:{
        openNewPost(){
            alert(99);
        }
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
