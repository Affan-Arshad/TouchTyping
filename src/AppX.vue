<template>
  <h1>{{ word }}</h1>
  <button @click="word = generateWord()">Generate</button>
</template>

<script>
var Filter = require('bad-words'),
    filter = new Filter({ placeHolder: ' '});
    filter.addWords('sss', 'sadist')

export default {
  name: 'App',
  data() {
    return {
      word: 'Click to generate a random word !',
      randomWords: [],
      max: 0,
      min: 100000
    }
  },
  methods: {
    generateWord() {
      let maxLength = 10;
      let minLength = 3;
      let word = '';
      let chars = 'abcdefghijklmnopqrstuvwxyz';

      // determine a random word length
      let wordLength = Math.floor(Math.random() * (maxLength - (minLength - 1))) + minLength;

      // add random letters together
      while(wordLength) {
        word += chars[Math.floor(Math.random() * chars.length)];
        wordLength--;
      }

      // Clean the word
      let cleanWord = filter.clean(word);
      if(cleanWord != word) {
        // console.log the bad word in reverse
        console.log(word.split("").reverse().join(""));
      }

      return cleanWord;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
