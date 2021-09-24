<template>
    <span>
        <span class="char">{{ char }}</span>
        <wbr v-if="char == '␣'">
    </span>
</template>

<script>
export default {
    props: {
        char: String,
    }
}
</script>

<style>
    @keyframes blink-cursor {
        0% { background-color: black; color: white;}
        49% { background-color: black; color: white;}
        50% { background-color: white; color: black;}
    }
    .active > .char {
        animation-name: blink-cursor;
        animation-duration: 1s;
        animation-iteration-count: infinite;
    }
    .char {
        font-size: 36px;
    }
    .error {
        color: red;
    }
    .complete {
        opacity: 0.5
    }

</style>