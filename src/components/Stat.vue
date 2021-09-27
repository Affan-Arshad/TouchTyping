<template>
    <div
      :style="[time ? {backgroundColor: `rgb(${time - 266}, ${(266+255)-time}, 0)`} : {backgroundColor: '#eee'}]">
        {{ letter }}
        <span>{{ time }}</span>
    </div>
</template>

<script>
export default {
    props: {
        time: Number,
        letter: String,
    }
}
</script>

<style lang="scss" scoped>
    .stat {
        font-size: 18px;
        padding: 2px 5px;
        margin: 2px;
        border: 1px solid #ddd;
        position: relative;
        opacity: 0.3;
    }
    .stat.active {
        opacity: 1;
    }
    .stat span {
        position: absolute;
        top: -22px;
        left: 50%;
        font-size: 9px;
        transform: translate(-50%, 0);
    }
</style>