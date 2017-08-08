<template>
    <v-card class="register-screen">
        <v-card-text class="pa-5">
            <form @submit.prevent="registerUser">
                <v-layout row wrap>
                    <v-flex xs12 class="mb-2">
                        <img :src="user.image" class="imgUp elevation-2" @click="addPhoto" />
                        <input type="file" @change="onFileChange" ref="hiddenFile" name="fileImage" id="fileImage" />
                    </v-flex>
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
                        <v-btn primary large type="submit">Register</v-btn>
                    </v-flex>
                </v-layout>
            </form>
        </v-card-text>
        <v-card-text>
            Already have an account? <router-link :to="{name: 'auth.login'}">Login</router-link>
        </v-card-text>
    </v-card>
</template>

<script>
import u from './../../../api/user'; 
import s from './../../../helpers/snackbar'; 
export default {
    data() {
        return {
            e: false,
            user: {
                name: '',
                title: '',
                email: '',
                image: '/images/avatar.jpg',
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
    },
    methods: {
        addPhoto() {
            this.$refs.hiddenFile.click();
        },
        onFileChange(e) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length)
                return;
            this.createImage(files[0]);
        },
        createImage(file) {
            let reader = new FileReader();
            let vm = this;
            reader.onload = (e) => {
                vm.user.image = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        registerUser(){
            console.log("Hwlo");
            u.signUp(this.user)
            .then(res => {
                s.fire(res.message+ ". Please log in");
                this.$router.push({name: 'auth.login'});
            });
        }
    }

}
</script>

<style lang="stylus" scoped>
.register-screen {
    text-align: center
    // width: 30em
}
.imgUp{
    height: 120px;
    // border: 1px solid red;
    border-radius: 50%;
    width: 120px;
}
#fileImage{
    display: none;
}
</style>
