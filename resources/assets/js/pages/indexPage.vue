<template>
    <v-app>
        <main>
            <v-container fluid class="index-page">
                <v-layout column class="contain" align-center fill-height justify-center>
                    <div class="r-image-box">
                        <img src="/images/logo.svg" />
                    </div>
                    <div class="r-title-box">
                        <h1 class="primary--text">Community Watch</h1>
                    </div>
                    <div class="r-sub-title-box">
                        <h5 class="primary--text">find and report news and incidents happening around you</h5>
                    </div>
                    <div class="r-sub-title-box">
                        <router-link tag="span" :to="{name: 'auth.login'}">
                            <v-btn primary large>
                                Login
                            </v-btn>
                        </router-link>
                        <router-link tag="span" :to="{name: 'dash.home'}">
                            <v-btn primary large outline>
                                Dashboard
                            </v-btn>
                        </router-link>
                    </div>
                </v-layout>
            </v-container>
        </main>
    </v-app>
</template>

<script>

export default {
}
</script>

<style lang="stylus">
    @import'~styles/stylus/colors';
    .index-page{
        position: absolute;
        height: 100%;
        background-color: $grey.lighten-2;
        .r-title-box > h1{
            font-weight: lighter;
        }
        .r-image-box{
            img{
                width: 200px;
            }
        }
    }
</style>
