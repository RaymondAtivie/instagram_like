<template>
    <v-card class="login-screen">
        <v-card-text class="pa-5">
            <v-layout row wrap>
                <v-flex xs12>
                    <v-text-field label="Title"></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-text-field label="E-mail"></v-text-field>
                </v-flex>
                <v-flex xs12>
                    <v-btn primary large>Login</v-btn>
                </v-flex>
            </v-layout>
        </v-card-text>
    </v-card>
</template>

<script>
export default {

}
</script>

<style lang="stylus">
.login-screen {
    text-align: center
    width: 30em;
}

</style>
