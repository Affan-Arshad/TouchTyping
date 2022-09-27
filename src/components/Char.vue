<template>
    <span>
        <span class="char" :errorkey="errorKey">{{ char }}</span>
        <wbr v-if="char == '␣'">
    </span>
</template>

<script>
export default {
    props: {
        char: String,
        errorKey: String,
    }
}
</script>
<style lang='scss'>

    // @keyframes blink-cursor {
    //     0% {background-color: $blink-dark; color: $blink-light;}
    //     49% {background-color: $blink-dark; color: $blink-light;}
    //     50% {background-color: $blink-light; color: $blink-dark;}
    // }
    @keyframes blink-cursor {
        0% {filter: invert(1)}
        49% {filter: invert(1)}
        50% {filter: invert(0)}
    }
    .char {
        font-size: 36px;
        color: $primary-color;
        // color: #000;
    }
    .space .char {
        opacity: 0.3;
    }
    .error .char {
        color: $error-color;
        opacity: 1;
        position: relative;
    }
    .complete {
        opacity: 0.3;
    }
    .error {
        opacity: 1;
    }
    .active .char {
        background-color: invert($primary-color);
        animation-name: blink-cursor;
        animation-duration: 1s;
        animation-iteration-count: infinite;
    }
    .active.error .char {
        background-color: invert($error-color);
    }
    .error .char:after {
        content: attr(errorkey);
        position: absolute;
        font-size: 13px;
        z-index: 1;
        top: -17px;
        left: 50%;
        transform: translateX(-50%);
    }

</style>