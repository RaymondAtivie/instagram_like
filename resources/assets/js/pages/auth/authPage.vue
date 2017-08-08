<template>
    <v-app>
        <main>
            <v-container fluid class="auth-page">
                <v-layout class="contain mt-3" justify-center>
                    <div class="r-image-box">
                        <router-link :to="{name: 'index'}">
                        <img class="clickable" src="/images/logo.jpeg" />
                        </router-link>
                    </div>
                </v-layout>
    
                <v-layout class="auth-screens" justify-center>
                    <v-flex xs12 sm8 md4>
                        <transition name="r-fade" mode="out-in">
                            <keep-alive>
                                <router-view></router-view>
                            </keep-alive>
                        </transition>
                    </v-flex>
                </v-layout>
    
                <v-layout class="contain mt-5" justify-center>
                    <div class="r-sub-title-box">
                        <router-link tag="span" :to="{name: 'index'}">
                            <v-btn primary large flat>
                                Home
                            </v-btn>
                        </router-link>
                        <router-link tag="span" :to="{name: 'auth.login'}">
                            <v-btn secondary large flat>
                                Login
                            </v-btn>
                        </router-link>
                        <router-link tag="span" :to="{name: 'auth.register'}">
                            <v-btn secondary large flat>
                                Register
                            </v-btn>
                        </router-link>
                        <router-link tag="span" :to="{name: 'dash.home'}">
                            <v-btn primary large flat>
                                Dashboard
                            </v-btn>
                        </router-link>
                    </div>
                </v-layout>
            </v-container>
        </main>
    
        <!-- <v-footer></v-footer> -->
    </v-app>
</template>

<script>
export default {
}
</script>

<style lang="stylus">
@import '~styles/stylus/colors';
.auth-page{
    // position: absolute;
    height: 100%;
    min-height 100vh;
    // background-color: $grey.lighten-2;  
    .r-image-box{
        img{ 
            width: 150px;
        }
    }
    .auth-screens{
        padding-top: 40px;
    min-height 480px;
    }
}

.r-fade-enter {
    opacity: 0;
    transform: translateY(-20px);
}

.r-fade-enter-active {
    transition: all .2s linear;
}

.r-fade-leave {
    /* opacity: 0; */
}

.r-fade-leave-active {
    transition: all .1s linear;
    opacity: 0;
    transform: translateY(20px);
}
</style>
