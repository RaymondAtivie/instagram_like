
<template>
    <v-list-tile :ripple="false">
        <v-list-tile-avatar class="hidden-xs-only">
            <img :src="comment.user.image">
        </v-list-tile-avatar>
        <v-list-tile-content>
            <v-list-tile-title class="primary--text">{{comment.user.name}}</v-list-tile-title>
            <v-list-tile-sub-title class="black--text py-1">
                <slot></slot>
            </v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action>
            <v-list-tile-action-text>{{comment.date}}</v-list-tile-action-text>
            <v-btn icon>
                <v-icon class="grey--text">thumb_up</v-icon>
            </v-btn>
        </v-list-tile-action>
    </v-list-tile>
</template>

<script>
export default {
    props: ['comment'],
    computed: {}
}
</script>

