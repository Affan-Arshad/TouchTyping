<template>
    <div class="stats mb-4">
        <Stat
          :class="{
              'stat': true,
              'active': index <= level-1
          }"
          v-for="(time, key, index) in avrgTimes"
          v-show="key != spaceChar"
          :key="key"
          :time="time"
          :letter="key"
          :targetTime="targetTime" />
    </div>
</template>

<script>
import Stat from './Stat.vue'
export default {
    name: 'Stats',
    props: {
        targetTime: Number,
        avrgTimes: Object,
        spaceChar: String,
        level: Number
    },
    components: {Stat},
    created() {
        console.log(this.avrgTimes);
    }
}
</script>

<style lang="scss">
    .stats {
        display: flex;
    }
</style>