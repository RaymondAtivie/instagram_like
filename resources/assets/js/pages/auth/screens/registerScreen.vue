<template>
    <v-card class="register-screen">
        <v-card-text class="pa-5">
            <v-layout row wrap>
                <v-flex xs12>
                    <v-text-field label="Full Name"></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="E-Mail"></v-text-field>
                </v-flex>
                 <v-flex xs12>
                    <v-text-field label="Password" hint="At least 8 characters" min="5" :append-icon="e ? 'visibility' : 'visibility_off'" :type="isPasswordVisible" :append-icon-cb="() => (e = !e)"></v-text-field>
                </v-flex> 
                <v-flex xs12>
                    <v-btn primary large>Register</v-btn>
                </v-flex>
            </v-layout>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data() {
        return {
            e: false
        }
    },
    computed: {
        isPasswordVisible(){
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
