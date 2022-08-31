var STORAGE_KEY = 'crossword_nexus_savegame';
var validWords=[];
var letters = [];
var discoveredWords =[];
var centerLetter = "";
var maxscore = 0;
var totalScore = 0;


// function to test if a word is a "pangram"
function is_pangram(word) {
    return (new Set(word).size == 7);
}


function validate_parameters(required, optional) {
    var combined = required + optional;
    // required length must be 1
    if (required.length !== 1) {
        return '"Required" parameter must be a single character';
    } else if (optional.length !== 6) {
        return '"Optional" parameter must be six letters';
    } else if (!is_pangram(combined)) {
        return 'Inputs are not all unique letters';
    } else if (combined.search(/[^a-z]/) != -1) {
        return 'Not all inputs are letters';
    }
    return '';
}

function computeScores(wordList) {
    var totalScore = 0;

    wordList.forEach(function(w) {
        if (w.length == 4) {
            totalScore += 1;
        }
        else if (is_pangram(w)) {
            totalScore += w.length + 7;
        }
        else if (w.length > 4) {
            totalScore += w.length;
        }
    });

    return totalScore;
}

function get_valid_words(words_json, required='', optional='') {
    // Reset all the global variables
    letters = [];
    validWords = words_json;
    maxScore = 0;

    // Read parameters provided
    required = required.toLowerCase();
    optional = optional.toLowerCase();
    var ret = validate_parameters(required, optional);
    if (ret) {
        alert(ret);
        return false;
    }

    // populate the "letters" global variable
    for (var i=0; i<6; i++) {
        letters.push(optional.charAt(i));
        if (i == 2) {
            letters.push(required);
        }
    }

    // Go through the words to populate validWords, pangram, maxScore
    maxscore = computeScores(validWords);
    return true;
}

function initialize_game(pk, words_json, required='', optional='') {
    // INIT PUZZLE
    savestate_name = pk
    get_valid_words(words_json, required=required, optional=optional);

    // LOAD ALREADY FOUND WORDS
    loadPuzzle(pk);
    updateDisplay();

    initialize_letters();
    initialize_score();
    shuffleLetters();
}

function initialize_score(){
  document.getElementById("maxscore").innerHTML = String(maxscore);
  document.getElementById("totalWords").innerHTML = String(validWords.length);
}

//Creates the hexagon grid of 7 letters with middle letter as special color
function initialize_letters(){

    var hexgrid = document.getElementById('hexGrid');
    hexGrid.innerHTML = '';
    for(var i=0; i<letters.length; i++){
        var char = letters[i];

        var pElement = document.createElement("P");
        pElement.innerHTML = char;

        var aElement = document.createElement("A");
        aElement.className = "hexLink";
        aElement.href = "#";
        aElement.appendChild(pElement);
        aElement.addEventListener('mousedown', clickLetter(char), false);
        aElement.addEventListener('dblclick', void(0), false);

        var divElement = document.createElement('DIV');
        divElement.className = "hexIn";
        divElement.appendChild(aElement);

        var hexElement = document.createElement("LI");
        hexElement.className = "hex";
        hexElement.appendChild(divElement);
        if(i==3){
          aElement.id = "center-letter";
          centerLetter = letters[i];
        }
        hexgrid.appendChild(hexElement);
    }
}

Array.prototype.shuffle = function() {
  let input = this;
  for (let i = input.length-1; i >=0; i--) {
    let randomIndex = Math.floor(Math.random()*(i+1));
    let itemAtIndex = input[randomIndex];
    input[randomIndex] = input[i];
    input[i] = itemAtIndex;
  }
  return input;
}

function shuffleLetters() {
    letters.shuffle()
    //get center letter back to letter[3]
    var centerIndex = letters.indexOf(centerLetter);
    if(letters[3] != centerLetter) {
        var temp = letters[3];
        letters[3] = centerLetter;
        letters[centerIndex] = temp;
    }
    var hexgrid = document.getElementById('hexGrid')
    while (hexgrid.firstChild) {
      hexgrid.removeChild(hexgrid.firstChild);
    }
    initialize_letters()
}

//When letter is clicked add it to input box
var clickLetter = function(letter){
  return function curried_func(e){
    var tryword = document.getElementById("testword");
    tryword.innerHTML = tryword.innerHTML + letter.toLowerCase();
  }
}

//Deletes the last letter of the string in the textbox
function deleteLetter(){
  var tryword = document.getElementById("testword");
  var trywordTrimmed = tryword.innerHTML.substring(0, tryword.innerHTML.length-1);
  tryword.innerHTML = trywordTrimmed
  if(!checkIncorrectLetters(trywordTrimmed)) {
      tryword.style.color = 'black';
  }
}

function wrongInput(selector){
  $(selector).fadeIn(1000);
  $(selector).fadeOut(500);

  clearInput();
}

function rightInput(selector){
  $(selector).fadeIn(1500).delay(500).fadeOut(1500);

  clearInput();
}

function clearInput(){
  $("#testword").empty();
}

function showPoints(pts){
  $(".points").html("+" + pts);
}

function updateDisplay() {
    showDiscoveredWord();
    showValidWords();
    document.getElementById("numfound").innerHTML = discoveredWords.length;
    totalScore = computeScores(discoveredWords)
    document.getElementById("score").innerHTML = totalScore;
}

//check if the word is valid and clear the input box
//word must be at least 4 letters
//word must contain center letter
//word can't already be found
function submitWord(){
  var tryword = document.getElementById('testword');
  var centerLetter = document.getElementById('center-letter').firstChild.innerHTML;

  let score = 0;
  var isPangram = false;
  var showScore = document.getElementById("totalScore");

  if(tryword.innerHTML.length < 4){
    wrongInput("#too-short");
  }else if(discoveredWords.includes(tryword.innerHTML.toLowerCase())){
    wrongInput("#already-found");
  }else if(!tryword.innerHTML.toLowerCase().includes(centerLetter.toLowerCase())){
    wrongInput("#miss-center");

  }else if(validWords.includes(tryword.innerHTML.toLowerCase())){

    discoveredWords.push(tryword.innerHTML);
    updateDisplay();


    var l = tryword.innerHTML.length;
    if(isPangram){
      rightInput("#pangram");
      showPoints(l + 7);
    }else if(l < 5){
      rightInput("#good");
      showPoints(1);
    }else if(l<7){
      rightInput("#great");
      showPoints(l);
    }else{
      rightInput("#amazing");
      showPoints(l);
    }

    savePuzzle(savestate_name);

  }else{
    wrongInput("#invalid-word");
  }
}

//if word was valid, display it
//if all words are found end game.
function showDiscoveredWord(){
    // SORT DISCOVERED WORDS
    discoveredWords.sort()

    // GET TEXT ZONE FOR NEW WORDS
    var discText = document.getElementById("discoveredText");

    while(discText.firstChild){
      discText.removeChild(discText.firstChild);
    }

    var numFound = discoveredWords.length;
    var numCol = Math.ceil(numFound/6);
    var w = 0;
    for(var c=0; c<numCol; c++){
      var list = document.createElement("UL");
      list.id= "discovered-words"+c;
      discText.appendChild(list);
      var n = 6;
      if(c == numCol-1){
        if(numFound%6 ==0){
          if(numFound==0){
            n = 0
          }
          else{
            n=6;
          }
        }else{
        n = numFound%6;}
      }
      for(var i=0; i<n; i++){
        var listword = document.createElement("LI");
        listword.classList.add("text-uppercase")
        listword.style = "list-style-type: none;";
        if(is_pangram(discoveredWords[w])) {
            listword.classList.add("fw-bolder");
            listword.classList.add("text-warning");
        }
        listword.innerHTML = discoveredWords[w];
        list.appendChild(listword);
        w++;
      }
    }
    if (numFound == validWords.length){
      alert("Vous avez trouvé tous les mots! Merci d'avoir joué");
    }
}

function showValidWords(){
    // GET TEXT ZONE FOR NEW WORDS
    var discText = document.getElementById("allWords");

    while(discText.firstChild){
      discText.removeChild(discText.firstChild);
    }

    const COLUMN_SIZE = 10
    var list = null;

    for(var w=0; w < validWords.length; w++){
        // IF REACHED COLUMN SIZE, CREATE NEW COLUMN
        if(w % COLUMN_SIZE == 0){
            list = document.createElement("UL");
            discText.appendChild(list);
        }

        // GENERATE STYLE
        var listword = document.createElement("LI");
        listword.classList.add("text-uppercase")
        listword.style = "list-style-type: none;";
        if(is_pangram(validWords[w])) {
            listword.classList.add("fw-bolder");
            listword.classList.add("text-warning");
        }
        if(discoveredWords.includes(validWords[w])){
            listword.classList.add("text-decoration-line-through");
        } else {
            listword.classList.add("fw-bolder");
        }

        // APPEND WORD TO LIST
        listword.innerHTML = validWords[w];
        list.appendChild(listword);
    }
}

//calculates the score of input "input" and also adjusts if "input" is a pangram
function calculateWordScore(input, isPangram) {

  let len = input.length;
  let returnScore = 1;
  if(len > 4) {
    if(isPangram) {
      returnScore = len + 7;
    } else {
      returnScore = len;
    }
  }
  return returnScore;
}

//checks if "input" word is a pangram
function checkPangram(input) {

  var i;
  var containsCount = 0;
  var containsAllLetters = false;
  for(i = 0; i < 7; i++) {
    if(input.includes(letters[i])) {
      containsCount++;
    }
  }
  if(containsCount == 7) {
    containsAllLetters = true;
  }
  return containsAllLetters;
}

function checkIncorrectLetters(input) {
  var i;
  var badLetterCount = 0;
  for(i = 0; i < input.length; i++) {
    if(!letters.includes(input[i])) {
      badLetterCount++;
    }
  }
  if(badLetterCount > 0) {
    return true;
  }
  return false;
}

//takes keyboard event from user and determines what should be done
function input_from_keyboard(event) {
  var tryword = document.getElementById("testword");

  if(event.keyCode == 13) {
    submitWord();
  }

  if(event.keyCode == 8) {
    deleteLetter();
  }

  //validation for just alphabet letters input
  if(event.keyCode >= 97 && event.keyCode <= 122 ||
    event.keyCode >=65 && event.keyCode <=90) {
    tryword.innerHTML = tryword.innerHTML+ String.fromCharCode(event.keyCode).toLowerCase();
    if(checkIncorrectLetters(tryword.innerHTML)) {
      tryword.style.color = 'grey';
    }
  }
}

// Set up cursor blinking
var cursor = true;
setInterval(() => {
  if(cursor) {
    document.getElementById('cursor').style.opacity = 0;
    cursor = false;
  }else {
    document.getElementById('cursor').style.opacity = 1;
    cursor = true;
  }
}, 600);

// save cells of puzzle
savePuzzle = function(savegame_name) {
    // Create save file
    var savegame = {
        discoveredWords: discoveredWords,
    };

    var savegame_name = STORAGE_KEY + (savegame_name || '');
    localStorage.setItem(savegame_name, JSON.stringify(savegame));
};

// loads saved puzzle
loadPuzzle = function(savegame_name) {
    var savegame_name = STORAGE_KEY + (savegame_name || '');
    var savegame = JSON.parse(localStorage.getItem(savegame_name));

    if (savegame && savegame.hasOwnProperty('discoveredWords'))
    {
        discoveredWords = savegame.discoveredWords;
    }
};
