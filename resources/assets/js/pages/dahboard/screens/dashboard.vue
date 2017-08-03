<template>
    <div>
        <h1>Dashboard Screen</h1>
        <v-layout row wrap id="text" grid-list-xs20>
            <v-flex xs12>
                <v-card dark class="primary">
                    <v-card-text>12</v-card-text>
                </v-card>
            </v-flex>
            <v-flex xs6 v-for="i in 2" :key="i">
                <v-card dark class="secondary">
                    <v-card-text>6</v-card-text>
                </v-card>
            </v-flex>
            <v-flex xs4 v-for="i in 3" :key="i">
                <v-card dark class="primary">
                    <v-card-text>4</v-card-text>
                </v-card>
            </v-flex>
            <v-flex xs3 v-for="i in 4" :key="i">
                <v-card dark class="secondary">
                    <v-card-text>3</v-card-text>
                </v-card>
            </v-flex>
            <v-flex xs2 v-for="i in 6" :key="i">
                <v-card dark class="primary">
                    <v-card-text>2</v-card-text>
                </v-card>
            </v-flex>
            <v-flex xs1 v-for="i in 12" :key="i">
                <v-card dark class="secondary">
                    <v-card-text>1</v-card-text>
                </v-card>
            </v-flex>
        </v-layout>
        <v-layout>
            <v-flex class="secondary">A</v-flex>
            <v-flex class="primary">B</v-flex>
        </v-layout>
    </div>
</template>

<script>
export default {

}
</script>

<style lang='scss'>
    #text{
        .flex{
            margin-bottom: 15px;
        }
    }
</style>
