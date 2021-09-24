<template>
  <div class="container">
    <Char
      :class="{ 
        'active': cursorPos == index,
        'error': errors[index] != null,
        'complete': index < cursorPos
      }"
      v-for="(char, index) in wordset"
      :key="index"
      :char="char"
      :errorKey="errors[index]" />
  </div>
</template>

<script>
var Filter = require('bad-words'),
    filter = new Filter({ placeHolder: ' '});

import Char from './components/Char.vue'

export default {
  name: 'App',
  components: { Char },
  data() {
    return {
      cursorPos: 0,
      errors: [],
      subDictionary: [],
      level: 6,
      letterProgression: 'enitrlsauodychgmpbkvwfzxqj',
      currentWords: []
    }
  },
  computed: {
    currentLetters() {
      return this.letterProgression.substr(0, this.level);
    },
    weakestLetters() {
      return [];
    },
    wordset() {
      return this.currentWords.join('␣');
    }
  },
  mounted() {
    // update subDictionary
    this.subDictionary = this.updateSubDictionary();
    this.getNewWordSet();

    // key listener
    window.addEventListener('keyup', this.keyHandler);

    // check clean
    // this.checkClean()

  },
  methods: {
    keyHandler(event) {
      // correct key press
      if(this.wordset[this.cursorPos] == event.key
      || (this.wordset[this.cursorPos] == '␣' && event.key == ' ')) {
        this.cursorPos++;
      } 
      // incorrect keypress
      else {
        this.errors[this.cursorPos] = event.key;
      }
      if(this.cursorPos == this.wordset.length) {
        this.getNewWordSet();
        this.cursorPos = 0;
        this.errors = [];
      }
    },
    getNewWordSet() { 
      this.currentWords = [];
      for (let i = 0; i < 20; i++) {
        this.currentWords.push(this.getWordWithLetters());
      }
    },
    updateSubDictionary(){
      let letters = this.currentLetters;
      // get a subset from dictionary
      // only words made from 'letters'
      let alphabet = 'abcdefghijklmnopqrstuvwxyz';
      while(letters.length) {
        alphabet = alphabet.replace(letters[0], '');
        letters = letters.substring(1);
      }
      let pattern = '/^['+ alphabet +']*$/';
      let re = new RegExp(pattern, "g");
      // return dictionary.filter(word => word.match(re, "regex"))
      return dictionary.filter(word => {
        for (const letter of alphabet) {
          if (word.includes(letter)) return false;
        }
        return true;
      })
    },
    getWordWithLetters(){
      let letters = this.weakestLetters;
      for(const letter of letters) {
        console.log(letter)
        if(!this.currentLetters.includes(letter)) {
          letters = [];
          break;
        }
      }
      let word = '';
      let found = false;
      while(!found) {
        found = true;
        word = this.getWord();
        for (const letter of letters) {
          if(!word.includes(letter)) {
            found = false;
          };
        }
      }
      return word;
    },
    getWord() {
      // // determine a random word length
      // let wordLength = Math.floor(Math.random() * (this.max - (this.min - 1))) + this.min;

      // // get word of length wordLength from dictionary
      // return this.getWordWithLength(wordLength);
      
      this.shuffleArray(this.subDictionary);
      let index = 0;
      let word = filter.clean(this.subDictionary[index]);
      while(!word.trim()) {
        console.log(this.subDictionary[index].split('').reverse().join(''));
        index++;
        word = filter.clean(this.subDictionary[index]);
      }
      return word;
    },
    checkClean() {
      let clean = dictionary;
      let index = 0;
      for (const word of dictionary) {
        let cleanWord = filter.clean(word);
        // console.log(word.split('').reverse().join(''));
        if(!cleanWord.trim()) {
          clean.splice(index, 1);
          console.log(index, word);
        }
        index++;
      }
      console.log(clean);
    },
    // getWordWithLength(length) {
    //   this.shuffleArray(this.subDictionary);
    //   return this.subDictionary.find(word => word.length == length);
    // },
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  },
}

filter.addWords('tittie', 'tittier');
</script>

<style>
#app {
  font-family: 'Inconsolata', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  text-align: left;
}
</style>
