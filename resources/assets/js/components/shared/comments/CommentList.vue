<template>
    <v-list three-line class="py-0">
        <r-add-comment user-image='/images/avatar.jpg'></r-add-comment>
        <template v-for="(comment, i) in comments">
            <r-comment :comment="comment" :key="i" class="py-2 px-2 removeListHover">{{comment.comment}}</r-comment>
            <v-divider v-if="i != comments.length-1" :key="i"></v-divider>
        </template>
    </v-list>
</template>

<script>
import Comment from './Comment';
import AddComment from './AddComment';
export default {
    props: ['comments'],
    components: {
        rComment: Comment,
        rAddComment: AddComment,
    }
}
</script>

<style lang="stylus">
</style>