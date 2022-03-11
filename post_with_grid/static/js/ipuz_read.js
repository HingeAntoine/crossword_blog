/**
* iPUZ reading/writing functions
* copyright (c) 2021 Crossword Nexus
* MIT License https://opensource.org/licenses/MIT
**/

/**
* Class for a crossword grid
**/
class xwGrid {
    constructor(cells) {
        this.cells = cells;
        this.height = Math.max.apply(null, cells.map(c => parseInt(c.y))) + 1;
        this.width = Math.max.apply(null, cells.map(c => parseInt(c.x))) + 1;
        this.numbers = this.gridNumbering();
    }
    /* return the cell at (x,y) */
    cellAt(x, y) {
        return this.cells.find((cell) => (cell.x == x && cell.y == y));
    }
    letterAt(x, y) {
        return this.cellAt(x, y).solution;
    }
    isBlack(x, y) {
        var thisCell = this.cellAt(x, y);
        return (thisCell.type == 'void' || thisCell.type == 'block');
    }
    /* check if we have a black square in a given direction */
    hasBlack(x, y, dir) {
        var mapping_dict = {
          'right': {'xcheck': this.width-1, 'xoffset': 1, 'yoffset': 0, 'dir2': 'left'}
        , 'left': {'xcheck': 0, 'xoffset': -1, 'yoffset': 0, 'dir2': 'right'}
        , 'top': {'ycheck': 0, 'xoffset': 0, 'yoffset': -1, 'dir2': 'bottom'}
        , 'bottom': {'ycheck': this.height-1, 'xoffset': 0, 'yoffset': 1, 'dir2': 'top'}
        };
        var md = mapping_dict[dir];
        if (x === md['xcheck'] || y === md['ycheck']) {
          return true;
        }
        else if (this.isBlack(x + md['xoffset'], y + md['yoffset'])) {
          return true;
        }
        else if (this.cellAt(x, y)[dir + '-bar']) {
          return true;
        }
        else if (this.cellAt(x + md['xoffset'], y + md['yoffset'])[md['dir2'] + '-bar']) {
          return true;
        }
        return false;
    }

    // both startAcrossWord and startDownWord have to account for bars
    startAcrossWord(x, y) {
        return this.hasBlack(x, y, 'left') && x < this.width - 1 && !this.isBlack(x, y) && !this.hasBlack(x, y, 'right');
    }
    startDownWord(x, y) {
        return this.hasBlack(x, y, 'top') && y < this.height - 1 && !this.isBlack(x, y) && !this.hasBlack(x, y, 'bottom');
    }
    // An array of grid numbers
    gridNumbering() {
        var numbers = [];
        var thisNumber = 1;
        for (var y=0; y < this.height; y++) {
            var thisNumbers = [];
            for (var x=0; x < this.width; x++) {
                if (this.startAcrossWord(x, y) || this.startDownWord(x, y)) {
                    thisNumbers.push(thisNumber);
                    thisNumber += 1;
                }
                else {
                    thisNumbers.push(0);
                }
            }
            numbers.push(thisNumbers);
        }
        return numbers;
    }

    acrossEntries() {
        var acrossEntries = {}, x, y, thisNum;
        for (y = 0; y < this.height; y++) {
            for (x = 0; x < this.width; x++) {
                if (this.startAcrossWord(x, y)) {
                    thisNum = this.numbers[y][x];
                    if (!acrossEntries[thisNum] && thisNum) {
                        acrossEntries[thisNum] = {'word': '', 'cells': []};
                    }
                }
                if (!this.isBlack(x, y) && thisNum) {
                    var letter = this.letterAt(x, y);
                    acrossEntries[thisNum]['word'] += letter;
                    acrossEntries[thisNum]['cells'].push([x, y]);
                }
                // end the across entry if we hit the edge
                if (this.hasBlack(x, y, 'right')) {
                    thisNum = null;
                }
            }
        }
        return acrossEntries;
    }

    downEntries() {
        var downEntries = {}, x, y, thisNum;
        for (x = 0; x < this.width; x++) {
            for (y = 0; y < this.height; y++) {
                if (this.startDownWord(x, y)) {
                    thisNum = this.numbers[y][x];
                    if (!downEntries[thisNum] && thisNum) {
                        downEntries[thisNum] = {'word': '', 'cells': []};
                    }
                }
                if (!this.isBlack(x, y) && thisNum) {
                    var letter = this.letterAt(x, y);
                    downEntries[thisNum]['word'] += letter;
                    downEntries[thisNum]['cells'].push([x, y]);
                }
                // end the down entry if we hit the bottom
                if (this.hasBlack(x, y, 'bottom')) {
                    thisNum = null;
                }
            }
        }
        return downEntries;
    }
}

function xw_read_ipuz(data) {
    // If `data` is a string, convert to object
    if (typeof(data) === 'string') {
        // need to read as UTF-8 first (it's generally loaded as binary)
        //data = BinaryStringToUTF8String(data);
        data = JSON.parse(data);
    }
    /*
    * `metadata` has title, author, copyright, description (notes), height, width, crossword_type
    */
    // determine the type of the crossword
    var kind = data['kind'][0];

    // determine what represents a block
    const BLOCK = data['block'] || '#';
    const EMPTY = data['empty'] || '0';

    // We only support "crossword" for now
    // TODO: add in acrostic support
    if (kind.indexOf('crossword') !== -1) {
        var crossword_type = 'crossword';
    } else {
        throw `${kind} is not supported`;
    }
    var height = data["dimensions"]["height"];
    var width = data["dimensions"]["width"];
    var metadata = {
        'title': data['title'] || '',
        'author': data['author'] || '',
        'copyright': data['copyright'] || '',
        'description': data.intro || '',
        'height': height,
        'width': width,
        'crossword_type': crossword_type,
        'fakeclues': data.fakeclues
    };

    /*
    * `cells` is an array of cells with the various attributes
      - x and y (0-indexed)
      - "type" = 'block' if it's a block
      - "number" = number if it's numbered
      - "solution" = letter(s) that go in the box
      - others: background-color (RGB), background-shape (circle),
          bottom-bar, right-bar, top-bar, left-bar (= true if exist)
    */
    var cells = [];
    for (var y=0; y < height; y++) {
        for (var x=0; x < width; x++) {
            // the cell is void if the spot is NULL
            var is_void = (data['puzzle'][y][x] === null);
            // number
            var cell_attributes = data['puzzle'][y][x] || {};
            // read in the style attribute
            var style = cell_attributes.style || {};
            if (typeof(cell_attributes) !== 'object') {
                var number = cell_attributes.toString();
            }
            else {
                var number = cell_attributes['cell'] || EMPTY;
                number = number.toString();
                if (number === EMPTY) {number = null;}
            }

            // solution
            var solution = '';
            try {
                solution = data['solution'][y][x];
                if (solution.value) {
                    solution = solution.value;
                } else if (solution.cell) {
                    solution = solution.cell;
                }

            } catch {}
            // type
            var type = null;
            if (solution === BLOCK || number === BLOCK) {
                type = 'block';
            } else if (data['puzzle'][y][x] === null) {
                type = 'void';
            }
            // filled-in letter
            var letter = null;
            if (data['puzzle'][y][x]) {
                letter = data['puzzle'][y][x].value;
            }
            // bars
            var bars = {};
            if (style.barred) {
                bars['bottom-bar'] = style.barred.includes('B');
                bars['right-bar'] = style.barred.includes('R');
                bars['top-bar'] = style.barred.includes('T');
                bars['left-bar'] = style.barred.includes('L');
            }

            // background shape and color
            background_shape = style.shapebg;
            background_color = style.color;
            // official iPuz style is RGB without a "#"
            // we add that if it's missing
            if (background_color && background_color.match('^[A-Fa-f0-9]{6}$')) {
              background_color = '#' + background_color.toString();
            }
            // top-right numbers
            var top_right_number = null;
            if (style.mark) {
                top_right_number = style.mark.TR;
                number = style.mark.TL;
                // TODO: we don't currently support bottom numbers
                // we just read them in as `number` or `top_right_number` for now
                if (!number) {number = style.mark.BL;}
                if (!top_right_number) {top_right_number = style.mark.BR;}
            }

            // Change the "number" if it isn't real
            if (number === EMPTY || number === BLOCK) {
                number = null;
            }

            var new_cell = {
                x: x,
                y: y,
                solution: solution,
                number: number,
                type: type,
                "background-color": background_color,
                "background-shape": background_shape,
                letter: letter,
                top_right_number: top_right_number,
                is_void: is_void,
                clue: null,
                value: null,
                "bottom-bar": bars['bottom-bar'] || null,
                "right-bar": bars['right-bar'] || null,
                "top-bar": bars['top-bar'] || null,
                "left-bar": bars['left-bar'] || null
            };
            cells.push(new_cell);
        } // end for x
    } // end for y

    /*
    * `clues` is an array of (usually) two objects.
       each object within has a "title" key whose value is generally "ACROSS" or "DOWN"
       and a "clue" key, whose value is an array of clues.
       Each "clue" key has
         - a "text" value which is the actual clue
         - a "word" which is the associated word ID
         - an optional "number"
    */
    var clues = [];
    var words = [];
    word_id = 1;
    // Iterate through the titles of the clues
    var titles = Object.keys(data['clues']);
    // Change the order if it's down first (CrossFire export bug)
    if (titles[0].toLowerCase() == 'down' && titles[1].toLowerCase() == 'across') {
      titles = [titles[1], titles[0]];
    }
    titles.forEach( function(title) {
        var thisClues = [];
        data['clues'][title].forEach( function (clue) {
            var number, text;
            // a "clue" can be an array or an object
            if (Array.isArray(clue)) {
                number = clue[0].toString();
                text = clue[1];
            } else {
                number = clue.number.toString();
                text = clue.clue;
            }
            thisClues.push({'word': word_id, 'number': number, 'text': text});
            // Cells are coupled with clues in iPuz
            if (clue.cells) {
                var thisCells = [];
                clue.cells.forEach(function (thisCell) {
                    thisCells.push([thisCell[0]-1, thisCell[1]-1]);
                });
                words.push({'id': word_id, 'cells': thisCells});
            }
            word_id += 1;
        });
        clues.push({'title': title, 'clue': thisClues});
    });


    /*
    * `words` is an array of objects, each with an "id" and a "cells" attribute
      "id" is just a unique number to match up with the clues.
      "cells" is an array of objects giving the x and y values, in order
    */
    // We only do this if we haven't already populated `words`
    if (!words.length) {
        var thisGrid = new xwGrid(cells);
        var word_id = 1;
        var acrossEntries = thisGrid.acrossEntries();
        Object.keys(acrossEntries).forEach(function(i) {
            var thisWord = {'id': word_id++, 'cells': acrossEntries[i]['cells']};
            words.push(thisWord);
        });
        var downEntries = thisGrid.downEntries();
        Object.keys(downEntries).forEach(function(i) {
            var thisWord = {'id': word_id++, 'cells': downEntries[i]['cells']};
            words.push(thisWord);
        });
    }

    console.log(cells)
    return [metadata, cells, clues, words];
}
