var validWords=[];
var letters = [];
var discoveredWords =[];
var totalScore = 0;
var pangram = "";
var centerLetter = "";
var numFound = 0;
var maxscore = 0;


// Adapted from https://stackoverflow.com/a/19303725
function kindaRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Function to test if a word works with our letters
function isGoodWord(required, optional, word) {
    const regex = new RegExp(`^[${required}${optional}]+$`);
    ret = true;
    if (word.length < 4) {
        ret = false;
    } else if (!word.includes(required)) {
        ret = false;
    } else if (!word.match(regex)) {
        ret = false;
    }
    return ret;
}

// function to test if a word is a "pangram"
function is_pangram(word) {
    return (new Set(word).size == 7);
}

function get_todays_starter(starters) {
    // Get today's date as an integer
    const todaysDate = new Date().toJSON().slice(0,10).replace(/-/g,'');
    const todayAsInt = Number(todaysDate);
    // Create a pseudo-random number from this date
    const rnd = kindaRandom(todayAsInt);
    // Grab a random starter from this
    var starter = starters[Math.floor(rnd*starters.length)];
    return starter;
}

function makeURL() {
    var thisURL = document.URL;
    var required = window.thisObject.required;
    var optional = window.thisObject.optional;
    var excl = window.thisObject.excl || '';
    var lastSlash = thisURL.lastIndexOf('/');
    var indexURL = thisURL.substring(0, lastSlash) + '/index.html';
    var newURL = `${indexURL}?required=${required}&optional=${optional}&excl=${excl}`;
    document.getElementById('url').innerHTML = `<a href="${newURL}" target="_blank">${newURL}</a>`;
}

function makeExcl() {
    // Add to the excluded words based on checkboxes
    var checkboxes = document.getElementsByClassName('hex-checkbox');
    var excl = [];
    for (var i=0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            excl.push(checkboxes[i].name);
        }
    }
    console.log(excl);
    window.thisObject.excl = btoa(JSON.stringify(excl));
    makeURL();
}

function makeValidWords() {
    // Make six columns with checkboxes for all the words
    var ctr = 0;
    var html = '';
    validWords.sort().forEach( function (word) {
        if (ctr == 0) {
            html += '<div class="row">\n';
        }
        html += `
        <div class="two columns">
            <label class="example">
              <input type="checkbox" id="${word}" name="${word}" class="hex-checkbox">
              <span class="label-body">${word}</span>
            </label>
        </div>`;
        if (ctr == 5) {
            html += '</div>\n';
        }
        ctr += 1;
        if (ctr == 6) {
            ctr = 0;
        }
    });
    document.getElementById('validWords').innerHTML = html;
    // Add a listener to the checkboxes
    var checkboxes = document.getElementsByClassName('hex-checkbox');
    for (var i=0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener('change', function() {
          makeExcl();
      });
    }
}

function create_results(words_json, required='', optional='') {
    // reset the global variables
    validWords = [];
    maxscore = 0;
    letters = [];
    // Get the valid words
    var ret = get_valid_words(words_json, required, optional);
    if (!ret) {
        return false;
    }

    required = required.toLowerCase();
    optional = optional.toLowerCase();

    window.thisObject = {'required': required, 'optional': optional};
    var numberPangrams = validWords.filter(word => is_pangram(word)).length;
    var html = `
        <div class="row">
            <span id="url">
            </span>
        </div>
        <div class="row">Total words: ${validWords.length}</div>
        <div class="row">Total pangrams: <span id="numPangrams">${numberPangrams}</span></div>
        <div class="row">Max score: <span id="numPangrams">${maxscore}</span></div>
        <div class="row">Allowable words (check a box to exclude a word)</div>
        <div id="validWords">
        </div>
    `;
    document.getElementById('results').innerHTML = html;
    makeURL();
    initialize_letters();
    makeValidWords();
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

function get_valid_words(words_json, required='', optional='', excl=new Set()) {
    // Start a game
    const starters = words_json['starters'];
    const words = words_json['words'];
    // Reset all the global variables
    letters = [];
    validWords = [];
    maxScore = 0;
    // TODO: read from query parameters to get these values
    if (required && optional) {
        required = required.toLowerCase();
        optional = optional.toLowerCase();
        var ret = validate_parameters(required, optional);
        if (ret) {
            alert(ret);
            return false;
        }
    }
    else {
        var starter = get_todays_starter(starters);
        required = starter[0];
        optional = starter[1];
    }
    // populate the "letters" global variable
    for (var i=0; i<6; i++) {
        letters.push(optional.charAt(i));
        if (i == 2) {
            letters.push(required);
        }
    }
    console.log(excl);
    // Go through the words to populate validWords, pangram, maxScore
    words.forEach( function(w) {
        if (isGoodWord(required, optional, w) && !excl.has(w)) {
            validWords.push(w);
            if (w.length == 4) {
                maxscore += 1;
            }
            else if (is_pangram(w)) {
                maxscore += w.length + 7;
                pangram = w;
            }
            else if (w.length > 4) {
                maxscore += w.length;
            }
        }
    });

    console.log(validWords);
    return true;
}

function initialize_game(words_json, required='', optional='', excl='') {
    if (excl) {
        excl = new Set(JSON.parse(atob(excl)));
    } else {
        excl=new Set();
    }
    get_valid_words(words_json, required=required, optional=optional, excl=excl);
    initialize_letters();
    initialize_score();
}

function initialize_score(){
  document.getElementById("maxscore").innerHTML = String(maxscore);
  // Initialize the number of words
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
        aElement.addEventListener('click', clickLetter(char), false);

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

    /*
    //fill in shuffled letters into hex grid
    for(var i=0; i<letters.length; i++) {
        var char = letters[i];
        var hexLetterElement = document.getElementsByClassName("hexLink");
        hexLetterElement[i].removeChild(hexLetterElement[i].firstChild);

        var pElement = document.createElement("P");
        pElement.innerHTML = char;
        hexLetterElement[i].appendChild(pElement);
    }*/
}

//Validate whether letter typed into input box was from one of 7 available letters
// document.getElementById("testword").addEventListener("keydown", function(event){
//     if(!letters.includes(event.key.toUpperCase())){
//         alert('Invalid Letter Typed')
//         event.preventDefault();
//     }
//   }
//   )

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
  $("#cursor").hide();
  $( "#testword" ).effect("shake", {times:2.5}, 450, function(){
      clearInput();
      $("#cursor").show();
    } );

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

    var isPangram = checkPangram(tryword.innerHTML);
    score = calculateWordScore(tryword.innerHTML, isPangram);
    addToTotalScore(score);
    console.log("totalscore: " + totalScore);

    showDiscoveredWord(tryword.innerHTML);
    numFound++;
    document.getElementById("numfound").innerHTML = numFound;
    document.getElementById("score").innerHTML = totalScore;

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

  }else{
    wrongInput("#invalid-word");
  }
}

//if word was valid, display it
//if all words are found end game.
function showDiscoveredWord(input){

    var discText = document.getElementById("discoveredText");
    discoveredWords.push(input.toUpperCase());
    discoveredWords.sort()
    while(discText.firstChild){
      discText.removeChild(discText.firstChild);
    }

    var numFound = discoveredWords.length;
    var numCol = Math.ceil(numFound/6);
    var w = 0;
    for(var c=0; c<numCol; c++){
      var list = document.createElement("UL");
      list.id= "discovered-words"+c;
      //list.style.cssText = "padding:5px 10px; font-weight:100; ";
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
        var pword = document.createElement("P");
        pword.innerHTML = discoveredWords[w];
        listword.appendChild(pword);
        list.appendChild(listword);
        w++;
      }
    }
    if (numFound == validWords.length){
      alert("You have found all of the possible words! Thanks for playing");
    }
}

//adds input "score" to the total score of user
function addToTotalScore(score) {
  totalScore += score;
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
  console.log('score ' + returnScore)
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
  console.log("isPangram?: " + containsAllLetters);
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
