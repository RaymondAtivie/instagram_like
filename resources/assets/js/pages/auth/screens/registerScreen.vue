<template>
    <v-card class="register-screen">
        <v-card-text class="pa-5">
            <v-layout row wrap>
                <v-flex xs12>
                    <v-text-field v-model="user.name" label="Full Name" prepend-icon="person" required></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="Short Description" prepend-icon="speaker_notes" multi-line rows='2' max="90" counter v-model="user.title" required></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="E-Mail" prepend-icon="email" v-model="user.email" required type='email'></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="Password" hint="At least 5 characters" :min="5" :append-icon="e ? 'visibility' : 'visibility_off'" :type="isPasswordVisible" :append-icon-cb="() => (e = !e)" prepend-icon="lock" v-model="user.password" required></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-btn primary large>Register</v-btn>
                </v-flex>
            </v-layout>
        </v-card-text>
        <v-card-text>
            Already have an account? <router-link :to="{name: 'auth.login'}">Login</router-link>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data() {
        return {
            e: false,
            user: {
                name: '',
                title: '',
                email: '',
                image: null,
                password: '',
            },
            rules: {
                required: (value) => !!value || 'Required.',
                email: (value) => {
                    const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    return pattern.test(value) || 'Invalid e-mail.'
                }
            }
        }
    },
    computed: {
        isPasswordVisible() {
            return this.e ? 'text' : 'password';
        }
    }

}
</script>

<style lang="stylus">
.register-screen {
    text-align: center
    // width: 30em
}
</style>
