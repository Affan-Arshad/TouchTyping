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

export default {
  name: 'App',
  components: { Char, Stats },
  data() {
    return {
      spaceChar: '␣',
      cursorPos: 0,
      errors: [],
      subDictionary: [],
      level: 26,
      letterProgression: 'enitrlsauodychgmpbkvwfzxqj',
      currentWords: [],
      stats: {},
      lastLetterTime: 0,
      avrgTimes: {},
      targetTime: 300,
      averageRange: 30,
      initialSpace: true,
      loadingWords: false,
      wordsPerSet: 5,
      dictionaryIndex: 0,
    }
  },
  computed: {
    currentLetters() {
      console.time('currentLetters');
      let currentLetters = this.letterProgression.substr(0, this.level);
      console.timeEnd('currentLetters');
      return currentLetters;
    },
    weakestLetters() {
      console.time('weakestLetters');
      let weakLetters = this.filterObject(this.avrgTimes, time => time > this.targetTime);
      let sortedWeakLetters = Object.fromEntries(
        Object.entries(weakLetters).sort(([,a], [,b]) => b - a)
      );
      let weakestDuo = Object.keys(sortedWeakLetters).slice(0, 2);
      console.timeEnd('weakestLetters');
      return weakestDuo;
    },
    wordset() {
      console.time('wordset');
      let wordset = this.currentWords.join(this.spaceChar);
      console.timeEnd('wordset');
      return wordset;
    }
  },
  created() {
    console.time('created');
    this.loadingWords = true;

    // smalldictionary
    console.log(dictionary.length);
    dictionary = dictionary.filter(word => word.length < 9);
    console.log(dictionary.length);

    // initialize stats
    for (const letter of this.letterProgression) {
      this.stats[letter] = [];
      this.avrgTimes[letter] = 0;
    }
    // this.avrgTimes = {...this.stats};

    // update subDictionary
    this.subDictionary = this.updateSubDictionary();
    this.getNewWordSet();

    // key listener
    window.addEventListener('keyup', this.keyHandler);

    this.loadingWords = false;
    console.timeEnd('created');
  },
  methods: {
    filterObject(obj, predicate) {
      console.time('filterObject');
      
      let filteredObject = Object.keys(obj)
            .filter( key => predicate(obj[key]) )
            .reduce( (res, key) => (res[key] = obj[key], res), {} );
      console.timeEnd('filterObject');
      return filteredObject;
    },
    keyHandler(event) {
      console.time('keyHandler');
      let now = Date.now();
      let hit = null;
      let timeToType = null;

      let currentLetter = this.wordset[this.cursorPos];
      // correct key press
      if(this.wordset[this.cursorPos] == event.key
      || (this.wordset[this.cursorPos] == '␣' && event.key == ' ')
      || (this.cursorPos == 0 && event.key == ' ' && this.initialSpace)) {
        
        if(this.cursorPos == 0 && event.key == ' ') {
          this.initialSpace = false;
          return;
        }
        
        hit = true;
        // avoid getting a huge number on last letter time for the initial test time
        this.lastLetterTime ? '' : this.lastLetterTime = now;
        timeToType = now - this.lastLetterTime;
        // update lastLetterTime
        this.lastLetterTime = now;

        // Move to next letter
        this.cursorPos++;
      } 
      // incorrect keypress
      else {
        hit = false
        this.errors[this.cursorPos] = event.key;
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
          if(key != this.spaceChar) {
            const letterStats = this.stats[key];
            if(letterStats.length) {
              let total = 0;
              let errors = 0;
              this.avrgTimes[key] = letterStats.reduce((hitOnly, stats) => {
                total++;
                if(stats.hit) {
                  hitOnly += stats.timeToType;
                } else errors++;

                if(letterStats.length == total) {
                  hitOnly = Math.floor(hitOnly / (total - errors));
                }
                return hitOnly;
              }, 0);
            }
          }
        }
      }

      if(this.cursorPos == this.wordset.length) {
        this.loadingWords = true;

        // Unlock Next Letter
        // const isBelowThreshhold = this.isBelowThreshhold(this.targetTime);
        // if(isBelowThreshhold) {
        //   this.level++;
        //   console.log('updateSubDictionary');
        //   this.subDictionary = this.updateSubDictionary();
        // }

        // clear wordset
        this.currentWords = '';
        this.cursorPos = 0;
        this.errors = [];
        this.lastLetterTime = 0;
        this.initialSpace = true;
        
        console.log('getNewWordSet');
        Promise.resolve().then(v => this.getNewWordSet());

        this.loadingWords = false;
      }
      console.timeEnd('keyHandler');
    },
    isBelowThreshhold(threshhold) {
      console.time('isBelowThreshhold');
      for (const avrg of Object.values(this.avrgTimes)) {
        console.log(avrg);
        if(avrg > threshhold) {
          return false;
        }
      }
      console.timeEnd('isBelowThreshhold');
      return true;
    },
    getNewWordSet() {
      console.time('getNewWordSet');
      Promise.resolve().then(v => {
        this.currentWords = [];
        for (let i = 0; i < this.wordsPerSet; i++) {
          this.currentWords.push(this.getWordWithLetters());
        }
      });
      console.timeEnd('getNewWordSet');
    },
    updateSubDictionary(){
      console.time('updateSubDictionary');
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
      console.timeEnd('updateSubDictionary');
      return subDictionary;
    },
    getWordWithLetters(){
      console.time('getWordWithLetters');
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
      console.timeEnd('getWordWithLetters');
      return word;
    },
    getWord() {
      console.time('getWord');
      // // determine a random word length
      // let wordLength = Math.floor(Math.random() * (this.max - (this.min - 1))) + this.min;

      // // get word of length wordLength from dictionary
      // return this.getWordWithLength(wordLength);
      
      let word = filter.clean(this.subDictionary[this.dictionaryIndex]);
      while(!word.trim()) {
        console.log(this.subDictionary[this.dictionaryIndex].split('').reverse().join(''));
        this.nextDictionaryIndex();
        word = filter.clean(this.subDictionary[this.dictionaryIndex]);
      }
      console.timeEnd('getWord');
      this.nextDictionaryIndex();
      return word;
    },
    nextDictionaryIndex() {
        this.dictionaryIndex == this.subDictionary.length ? this.dictionaryIndex = 0 : this.dictionaryIndex++;
    },
    checkClean() {
      console.time('checkClean');
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
      console.timeEnd('checkClean');
    },
    // getWordWithLength(length) {
    //   this.shuffleArray(this.subDictionary);
    //   return this.subDictionary.find(word => word.length == length);
    // },
    shuffleArray(array) {
      console.time('shuffleArray');
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      console.timeEnd('shuffleArray');
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
</style>
