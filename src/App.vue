<template>
  <div class="container pt-5">
    <Stats :avrgTimes="avrgTimes" :spaceChar="spaceChar" :level="level" :targetTime="targetTime"/>

    <div v-if="!loadingWords">
      <Char
        :class="{ 
          'active': cursorPos == index,
          'error': errors[index] != null,
          'complete': index < cursorPos,
          'space': char == spaceChar
        }"
        v-for="(char, index) in wordset"
        :key="index"
        :char="char"
        :errorKey="errors[index]" />
    </div>

    <div v-else> Loading... </div>
  </div>
</template>

<script>
var Filter = require('bad-words'),
    filter = new Filter({ placeHolder: ' '});

import Char from './components/Char.vue'
import Stats from './components/Stats.vue'

const bgWordGenerator = new Worker(
  "js/background-word-generator-worker.js"
);

export default {
  name: 'App',
  components: { Char, Stats },
  data() {
    return {
      spaceChar: '␣',
      cursorPos: 0,
      errors: [],
      subDictionary: [],
      level: 6,
      letterProgression: 'enitrlsauodychgmpbkvwfzxqj',
      currentWords: [],
      stats: {},
      lastLetterTime: 0,
      avrgTimes: {},
      targetTime: 450,
      averageRange: 30,
      initialSpace: true,
      loadingWords: false,
      error: null,
      wordsPerSet: 15,
      dictionaryIndex: 0,
    }
  },
  computed: {
    currentLetters() {
      let currentLetters = this.letterProgression.substr(0, this.level);
      return currentLetters;
    },
    weakestLetters() {
      let weakLetters = this.filterObject(this.avrgTimes, time => time > this.targetTime);
      let sortedWeakLetters = Object.fromEntries(
        Object.entries(weakLetters).sort(([,a], [,b]) => b - a)
      );
      let weakestLettersCount = 5;
      let weakestSet = Object.keys(sortedWeakLetters).slice(0, weakestLettersCount);
      return weakestSet;
    },
    wordset() {
      let wordset = this.currentWords.join(this.spaceChar);
      return wordset;
    }
  },
  created() {

    // callback for events from worker
    bgWordGenerator.onmessage = (event) => {
      if (Array.isArray(event.data.key)) {
        event.data.key.forEach((key, i) => {
          this[key] = event.data.value[i]
        })
      }
      this[event.data.key] = event.data.value;
    };

    // smalldictionary
    dictionary = dictionary.filter(word => word.length < 9);

    // initialize stats
    for (const letter of this.letterProgression) {
      this.stats[letter] = [];
      this.avrgTimes[letter] = 0;
    }
    // this.avrgTimes = {...this.stats};

    // update subDictionary
    // this.subDictionary = this.updateSubDictionary();

    // this.getNewWordSet();
    this.loadingWords = true;
    this.currentWords = [];
    this.error ? this.error = null : '';
    bgWordGenerator.postMessage({
      method: "getNewWordSets",
      args: [this.wordsPerSet, this.weakestLetters, this.currentLetters, Object.values(this.subDictionary), this.dictionaryIndex, true],
    });

    // key listener
    window.addEventListener('keyup', this.keyHandler);

  },
  methods: {
    filterObject(obj, predicate) {
      
      let filteredObject = Object.keys(obj)
            .filter( key => predicate(obj[key]) )
            .reduce( (res, key) => (res[key] = obj[key], res), {} );
      return filteredObject;
    },
    keyHandler(event) {
      if(this.cursorPos < this.wordset.length-1 && !this.loadingWords) {
        let char = event.key;
        this.errors[this.cursorPos] = null;
        
        // ignore backspace
        if(char == "Backspace") {
          this.cursorPos--;
          return;
        }

        // change space to space char
        if(char == " ") char = this.spaceChar

        let now = Date.now();
        let hit = null;
        let timeToType = null;

        let currentLetter = this.wordset[this.cursorPos];
        // correct key press
        if(this.wordset[this.cursorPos] == char
        // || (this.wordset[this.cursorPos] == '␣' && char == ' ') // Chnaged space to space char above.. so no more need
        || (this.cursorPos == 0 && char == this.spaceChar && this.initialSpace)) {
          
          if(this.cursorPos == 0 && char == this.spaceChar) {
            this.initialSpace = false;
            return;
          }
          
          hit = true;

          // time to type
          timeToType = this.getTimeToType(now);

          // Move to next letter
          this.cursorPos++;
        } 
        // incorrect keypress
        else {
          hit = false
          this.errors[this.cursorPos] = char;

          // time to type
          timeToType = this.getTimeToType(now) +400;
          console.log(timeToType);
          
          // Move to next letter
          this.cursorPos++;
        }

        /*
        * Collect Data
        */
        // initialize if don't have data for this letter
        this.stats[currentLetter] ? '' : this.stats[currentLetter] = [];

        // push data about key to its index
        this.stats[currentLetter].unshift({
          "timestamp": now,
          "timeToType": timeToType,
          "hit": hit
        });
        // cut the array short according to average range 
        this.stats[currentLetter] = this.stats[currentLetter].slice(0, this.averageRange);

        // Calculate avrgTimes for all correct keypresses
        for (const key in this.stats) {
          if (Object.hasOwnProperty.call(this.stats, key)) {
            // if(key != this.spaceChar) {
              const letterStats = this.stats[key];
              if(letterStats.length) {
                let total = 0;
                // let errors = 0;
                this.avrgTimes[key] = letterStats.reduce((hitOnly, stats) => {
                  total++;
                  // if(stats.hit) {
                    hitOnly += stats.timeToType;
                  // } else errors++;

                  if(letterStats.length == total) {
                    // hitOnly = Math.floor(hitOnly / (total - errors));
                    hitOnly = Math.floor(hitOnly / total);
                  }
                  return hitOnly;
                }, 0);
              }
            // }
          }
        }
      }
      else if (!this.loadingWords) {
        if(this.cursorPos == this.wordset.length-1) {

          let updateSubDictionary = false;
          // Unlock Next Letter
          const isBelowThreshhold = this.isBelowThreshhold(this.targetTime);
          if(isBelowThreshhold) {
            this.level++;
            // this.subDictionary = this.updateSubDictionary();
            updateSubDictionary = true;
          }

          // clear wordset
          this.cursorPos = 0;
          this.errors = [];
          this.lastLetterTime = 0;
          this.initialSpace = true;
          
          // this.getNewWordSet();
          this.loadingWords = true;
          this.currentWords = [];
          this.error ? this.error = null : '';

          bgWordGenerator.postMessage({
            method: "getNewWordSets",
            args: [this.wordsPerSet, this.weakestLetters, this.currentLetters, Object.values(this.subDictionary), this.dictionaryIndex, updateSubDictionary],
          });
        }
      }
    },
    getTimeToType(now) {
      // avoid getting a huge number on last letter time for the initial test time
      this.lastLetterTime ? '' : this.lastLetterTime = now;
      let timeToType = now - this.lastLetterTime;
      // update lastLetterTime
      this.lastLetterTime = now;

      return timeToType;
    },
    isBelowThreshhold(threshhold) {
      for (const avrg of Object.values(this.avrgTimes)) {
        if(avrg > threshhold) {
          return false;
        }
      }
      return true;
    },
    getNewWordSet() {
      this.currentWords = [];
      this.error ? this.error = null : '';
      let weakestLetters = this.weakestLetters;
      let currentLetters = this.currentLetters;
      let subDictionary = Object.values(this.subDictionary);
      bgWordGenerator.postMessage({
        method: "getNewWordSets",
        args: [this.wordsPerSet, weakestLetters, currentLetters, subDictionary, this.dictionaryIndex],
      });
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
      let subDictionary = dictionary.filter(word => {
        for (const letter of alphabet) {
          if (word.includes(letter)) return false;
        }
        return true;
      })
      
      this.shuffleArray(subDictionary);
      return subDictionary;
    },
    getWordWithLetters(){
      let letters = this.weakestLetters;
      for(const letter of letters) {
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
      
      let word = filter.clean(this.subDictionary[this.dictionaryIndex]);
      while(!word.trim()) {
        this.nextDictionaryIndex();
        word = filter.clean(this.subDictionary[this.dictionaryIndex]);
      }
      this.nextDictionaryIndex();
      return word;
    },
    nextDictionaryIndex() {
        this.dictionaryIndex == this.subDictionary.length ? this.dictionaryIndex = 0 : this.dictionaryIndex++;
    },
    checkClean() {
      let clean = dictionary;
      let index = 0;
      for (const word of dictionary) {
        let cleanWord = filter.clean(word);
        if(!cleanWord.trim()) {
          clean.splice(index, 1);
        }
        index++;
      }
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

// filter.addWords('bad');
</script>

<style lang="scss">
#app {
  // background-color: lighten($primary-color, 50);
  font-family: 'Inconsolata', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  text-align: left;
}
.container {
  white-space: nowrap;
}
</style>
