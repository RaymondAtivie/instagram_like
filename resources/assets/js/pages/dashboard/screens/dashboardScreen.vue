<template>
    <div>
        <div class="title">Posts</div>
        <br />
        <v-layout row>
            <v-flex xs12 sm6 offset-sm3>
                <v-card class="post-card">
                    <v-card-media src="/images/image1.jpg" height="400px"></v-card-media>
                    <v-card-title primary-title>
                        <div>
                            <span>
                                loremSint sit amet quos aut. Rem dolor natus. Temporibus voluptas vel earum nisi soluta eos. Dolorum quo molestias voluptatem sapiente voluptatum. Quisquam expedita est doloremque ea neque. Voluptatem vero accusamus accusamus.
                            </span>
                        </div>
                    </v-card-title>
                    <v-card-actions class="secondary">
                        <v-btn icon>
                            <v-icon>favorite</v-icon>
                        </v-btn>
                        <v-btn icon>
                            <v-icon>bookmark</v-icon>
                        </v-btn>
                        <v-btn icon>
                            <v-icon>share</v-icon>
                        </v-btn>
                        <v-spacer></v-spacer>
                        <v-btn flat>
                            <v-icon>comment</v-icon>
                            &nbsp;&nbsp;&nbsp;&nbsp;
                            Comments
                        </v-btn>
                        <v-btn icon @click.native="show = !show">
                            <v-icon>{{ show ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</v-icon>
                        </v-btn>
                    </v-card-actions>
                    
                </v-card>
                    <transition name="slide">
                        <v-card v-show="show">
                            <v-card-text>
                                I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time for sleeping, soldier, not with all the bed making you'll be doing. Then we'll go with that data file! Hey, you add a one and two zeros to that or we walk! You're going to do his laundry? I've got to find a way to escape.
                            </v-card-text>
                        </v-card>
                    </transition>
            </v-flex>
        </v-layout>
    </div>
</template>

<script>
export default {
    data(){
        return{
            show: false
        }
    }

}
</script>

<style lang='stylus'>
.slide-enter {
    // opacity: 0;
    // transform: translateY(-20px);
    height: 0px;
    background-color: #eac123;
    // border: 1px solid red;
}

.slide-enter-active {
    border: 1px solid blue;
    // height: auto;    
    transition: all 5s linear;
    background-color: #da2123;
}

.slide-leave {
    height: 0px;    
}

.slide-leave-active {
    overflow: hidden;
    height: 0px;
    // animation: scaleDown .2s forwards;
    // transform: translateY(20px);
    transition height 3s ease;    
}

// .post-card{
//     transition: all 3s;
// }
</style>
