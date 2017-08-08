<template>
    <v-card class="login-screen">
        <v-card-text class="pa-5 pb-0">
            <v-layout column>
                <form @submit.prevent="loginAttempt">
                <v-flex xs12>
                    <v-text-field label="E-Mail" prepend-icon="email" v-model="user.email" type='email'></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="Password" :append-icon="e ? 'visibility' : 'visibility_off'" :type="isPasswordVisible" :append-icon-cb="() => (e = !e)" prepend-icon="lock" v-model="user.password"></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-btn type="submit" primary large>Login</v-btn>
                </v-flex>
                </form>
            </v-layout>
        </v-card-text>
        <v-card-text>
            Don't have an account? <router-link :to="{name: 'auth.register'}">Register</router-link>
        </v-card-text>
    </v-card>
</template>

<script>
import user from './../../../api/user.js';
import s from './../../../helpers/snackbar.js';

export default {
    data(){
        return {
            e: false,
            user: {
                email: '',
                password: '',
            },
        }
    },
    computed: {
        isPasswordVisible() {
            return this.e ? 'text' : 'password';
        }
    },
    methods: {
        loginAttempt(){
            console.log('attempting login');
            console.log(this.user.email);

            user.attempt(this.user.email, this.user.password)
            .then(res => {
                s.fire(res.message);
                this.$router.push({name: 'dash.home'});
            })
        }
    }
}
</script>

<style lang="stylus">
.login-screen {
    text-align: center;
    // width: 300px;
}

</style>
