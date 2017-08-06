<template>
    <v-card>
        <form @submit.prevent="posted">
            <v-card-title class="headline">Add a new post</v-card-title>
            <div class="grey lighten-2">
                <v-layout align-center>
                    <v-flex md2 class="hidden-xs-only">
                        <v-list-tile-avatar>
                            <img :src="userImage" />
                        </v-list-tile-avatar>
                    </v-flex>
                    <v-flex xs12 sm10>
                        <v-text-field class="pb-0" v-model="post.text" label="write a post" full-width multi-line rows="3"></v-text-field>
                    </v-flex>
                </v-layout>
            </div>
            
            <v-card-media v-if="post.media" :src="post.media.link" height="300px"></v-card-media>

            <v-card-actions class="secondary">
                <v-switch v-bind:label="'Report'" v-model="post.isReport" class="ma-0 pa-0 ml-3" hide-details color="primary"></v-switch>
                <v-spacer></v-spacer>
                <v-btn flat icon class="mx-2" v-tooltip:left="{html: 'Add a photo'}" @click="addPhoto" v-if="!post.media">
                    <v-icon>add_a_photo</v-icon>
                </v-btn>
                <v-btn flat icon class="mx-2" v-tooltip:left="{html: 'Remove photo'}" @click="removePhoto" v-else>
                    <v-icon>close</v-icon>
                </v-btn>
            </v-card-actions>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn type="button" class="primary--text" flat="flat" @click.native="cancelled">Cancel</v-btn>
                <v-btn type="submit" class="primary" :loading="posting" :disabled="posting">Post</v-btn>
            </v-card-actions>
            <input type="file" @change="onFileChange" ref="hiddenFile" name="fileImage" id="fileImage" />
        </form>
    </v-card>
</template>

<script>
export default {
    props: {
        userImage: {
            default: '/images/unkown.jpg',
            type: String
        },
        clear: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialog: true,
            isReport: false,
            post: {
                text: '',
                media: false,
                isReport: false
            },
            posting: false
        }
    },
    watch: {
        clear() {
            if (this.clear) {
                this.post = {
                    text: '',
                    media: false,
                    isReport: false
                },
                    this.posting = false;
            }
        }
    },
    methods: {
        removePhoto() {
            this.post.media = null;
        },
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
                vm.post.media = {
                    link: e.target.result,
                    type: 'image'
                }
            };
            reader.readAsDataURL(file);
        },
        cancelled() {
            this.post = {
                text: '',
                media: false,
                isReport: false
            },
            this.posting = false;
            this.$emit('canceled');
        },
        posted() {
            this.posting = true;
            this.$emit('posted', this.post);
        }
    }
}
</script>

<style lang="stylus" scoped>
    #fileImage{
        display: none;
    }
</style>