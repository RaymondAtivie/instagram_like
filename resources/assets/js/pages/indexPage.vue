<template>
    <v-container fluid class="index-page">
         <v-layout column class="contain" align-center fill-height justify-center>
            <div class="r-image-box">
                <img src="/images/logo.png" />
            </div>
            <div class="r-title-box">
                <h1 class="primary--text">Vumen</h1>
            </div>
            <div class="r-sub-title-box">
                <h5 class="primary--text">a complete scafolding app for you laravel/vue project</h5>
            </div>
            <div class="r-sub-title-box">
                <router-link tag="span" :to="{name: 'auth.login'}">
                    <v-btn secondary large>
                            Authentication
                    </v-btn>
                </router-link>
                <router-link tag="span" :to="{name: 'dash.home'}">
                    <v-btn secondary large outline>
                        Dashboard
                    </v-btn>
                </router-link>
            </div>
        </v-layout> 
    </v-container>
</template>

<script>

export default {
}
</script>

<style lang="stylus">
    @import'./../../stylus/colors';
    .index-page{
        position: absolute;
        height: 100%;
        background-color: $cyan.lighten-5
        .r-image-box{
            img{
                width: 200px;
            }
        }
    }
</style>
