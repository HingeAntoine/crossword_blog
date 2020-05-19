// CluesGroup stores clues and map of words
var CluesGroup = function(crossword, data) {
    this.id = '';
    this.title = '';
    this.clues = [];
    this.clues_container = null;
    this.words_ids = [];
    this.crossword = crossword;
    if (data) {
        if (data.hasOwnProperty('id') && data.hasOwnProperty('title') && data.hasOwnProperty('clues') && data.hasOwnProperty('words_ids')) {
            this.id = data.id;
            this.title = data.title;
            this.clues = data.clues;
            this.words_ids = data.words_ids;
        } else {
            load_error = true;
        }
    }
};

// parses xml and fills properties
CluesGroup.prototype.fromJPZ = function(xml_data) {
    var k, clue,
        title_el = xml_data.getElementsByTagName('title')[0],
        clues_el = xml_data.getElementsByTagName('clue');
    this.title = XMLElementToString(title_el);
    for(k=0; clue=clues_el[k]; k++) {
        var word_id = clue.getAttribute('word'), word = this.crossword.words[word_id],
            new_clue = {
                word: word_id,
                number: clue.getAttribute('number'),
                text: XMLElementToString(clue)
            };
        this.clues.push(new_clue);
        word.clue = new_clue;
        this.words_ids.push(word_id);
    }
};

CluesGroup.prototype.getFirstWord = function() {
    if (this.words_ids.length) {
        return this.crossword.words[this.words_ids[0]];
    }
    return null;
};

// gets word which has cell with specified coordinates
CluesGroup.prototype.getMatchingWord = function(x, y, change_word=false) {
    var i, word_id, word, words = [];
    for (i=0; word_id=this.words_ids[i];i++) {
        word = this.crossword.words.hasOwnProperty(word_id) ? this.crossword.words[word_id] : null;
        if (word && word.cells.indexOf(x+'-'+y) >= 0) {
            words.push(word);
        }
    }
    if (words.length == 1) {
        return words[0];
    }
    else if (words.length == 0) {
        return null;
    }
    else {
        // with more than one word we look for one
        // that's either current or not
        for (i=0; i<words.length; i++) {
            word = words[i];
            if (change_word) {
                if (word.id != this.crossword.selected_word.id) {
                    return word;
                }
            }
            else {
                if (word.id == this.crossword.selected_word.id) {
                    return word;
                }
            }
        }
        // if we didn't match a word in the above
        // just return the first one
        return words[0];
    }
    return null;
};

// in clues list, marks clue for word that has cell with given coordinates
CluesGroup.prototype.markActive = function(x, y, is_passive) {
    var classname = is_passive ? 'passive' : 'active',
        word = this.getMatchingWord(x, y),
        clue_el, clue_position, clue_height;
    this.clues_container.find('div.cw-clue.active').removeClass('active');
    this.clues_container.find('div.cw-clue.passive').removeClass('passive');
    if (word) {
        clue_el = this.clues_container.find('div.cw-clue.word-'+word.id);
        clue_el.addClass(classname);
        clue_position = clue_el.position().top;
        clue_height = clue_el.outerHeight(true);
        if (clue_position < 0 || clue_position+clue_height > this.clues_container.height()) {
            this.clues_container.animate({scrollTop: this.clues_container.scrollTop()+clue_position}, 150);
        }
    }
};

// returns word next to given
CluesGroup.prototype.getNextWord = function(word) {
    var next_word = null,
        index = this.words_ids.indexOf(word.id);
    if (index < this.words_ids.length - 1) {
        next_word = this.crossword.words[this.words_ids[index+1]];
    }
    return next_word;
};

// returns word previous to given
CluesGroup.prototype.getPreviousWord = function(word) {
    var prev_word = null,
        index = this.words_ids.indexOf(word.id);
    if (index > 0) {
        prev_word = this.crossword.words[this.words_ids[index-1]];
    }
    return prev_word;
};