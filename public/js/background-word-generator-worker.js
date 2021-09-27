const calculations = {
    dictionaryIndex: null,
    subDictionary: null,
    weakestLetters: null,
    currentLetters: null,
    getNewWordSets: (wordsPerSet, weakestLetters, currentLetters, subDictionary, dictionaryIndex) => {
        // Initialize Properties
        calculations.dictionaryIndex = dictionaryIndex;
        calculations.subDictionary = subDictionary;
        calculations.weakestLetters = weakestLetters;
        calculations.currentLetters = currentLetters;
        
        let currentWords = [];
        for (let i = 0; i < wordsPerSet; i++) {
          currentWords.push(calculations.getWordWithLetters());
        }
        
        return [currentWords, calculations.dictionaryIndex];
    },
    getWordWithLetters() {
      let letters = calculations.weakestLetters;
      for(const letter of letters) {
        if(!calculations.currentLetters.includes(letter)) {
          letters = [];
          break;
        }
      }
      let word = '';
      let found = false;
      while(!found) {
        found = true;
        word = calculations.getWord();
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
      // let wordLength = Math.floor(Math.random() * (calculations.max - (calculations.min - 1))) + calculations.min;

      // // get word of length wordLength from dictionary
      // return calculations.getWordWithLength(wordLength);
      
      let word = calculations.subDictionary[calculations.dictionaryIndex];
      // word = filter.clean(word);
      // while(!word.trim()) {
      //   calculations.nextDictionaryIndex();
      //   word = filter.clean(calculations.subDictionary[calculations.dictionaryIndex]);
      // }
      calculations.nextDictionaryIndex();
      return word;
    },
    nextDictionaryIndex() {
        calculations.dictionaryIndex == calculations.subDictionary.length ? calculations.dictionaryIndex = 0 : calculations.dictionaryIndex++;
    },
}

addEventListener("message", (event) => {
    postMessage({ key: "loadingWords", value: true});
    if (Object.keys(calculations).includes(event.data.method)) {
        postMessage({
            key: ["currentWords", "dictionaryIndex"],
            value: calculations[event.data.method](...event.data.args),
        });
    } else {
        postMessage({
            key: "error",
            value: "No calculation found " + (event.data.method ? 'for type ' + event.data.method : ''),
        });
    }
    postMessage({ key: "loadingWords", value: false });
});