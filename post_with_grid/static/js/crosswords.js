/**
Copyright (c) 2015-2020, Crossword Nexus
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
// Main crossword javascript for the Crossword Nexus HTML5 Solver

(function(global, factory) {
    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory(global);
    } else {
        factory(global, true);
    }
}(typeof window !== "undefined" ? window : this, function(window, registerGlobal) {
    "use strict";

    var CrosswordNexus = {
        createCrossword: function(parent, user_config) {
            var crossword;
            try {
                if (typeof jQuery === TYPE_UNDEFINED) {
                    throw new Error(ERR_NO_JQUERY);
                }
                if (typeof PUZAPP === TYPE_UNDEFINED) {
                    throw new Error(ERR_NO_PUZJS);
                }
                if (user_config && user_config.hasOwnProperty(ZIPJS_CONFIG_OPTION)) {
                    ZIPJS_PATH = user_config[ZIPJS_CONFIG_OPTION];
                }
                crossword = new CrossWord(parent, user_config);
            } catch (e) {
                alert(e.message);
            }
            return crossword;
        }
    };

    var CrossWord = function(parent, user_config) {
        this.parent = parent;
        this.config = {};

        // Load solver config
        var solver_config_name = SETTINGS_STORAGE_KEY;
        var saved_settings = JSON.parse(localStorage.getItem(solver_config_name));
        var i;
        for (i in default_config) {
            if (default_config.hasOwnProperty(i)) {
                        // Check saved settings before "user" settings
                        if (saved_settings && saved_settings.hasOwnProperty(i)) {
                    this.config[i] = saved_settings[i];
                } else if (user_config && user_config.hasOwnProperty(i)) {
                    this.config[i] = user_config[i];
                } else {
                    this.config[i] = default_config[i];
                }
            }
        }
        this.cell_size = 40;
        this.top_text_height = 0;
        this.bottom_text_height = 0;
        this.grid_width = 0;
        this.grid_height = 0;
        this.cells = {};
        this.words = {};
        this.clues_top = null;
        this.clues_bottom = null;
        this.active_clues = null;
        this.inactive_clues = null;
        this.hovered_x = null;
        this.hovered_y = null;
        this.selected_word = null;
        this.hilited_word = null;
        this.selected_cell = null;

        // TIMER
        this.timer_running = false;
        
        // Solution message
        this.msg_solved = MSG_SOLVED;
        
        this.render_cells_callback = $.proxy(this.renderCells, this);

        this.init();
    };

    CrossWord.prototype.init = function() {
        var parsePUZ_callback = $.proxy(this.parsePUZPuzzle, this);
        var error_callback = $.proxy(this.error, this);

        // build structures
        this.top_text = $('#cw-top-text');

        this.clues_top_container = $('#cw-clues-top');
        this.clues_bottom_container = $('#cw-clues-bottom');

        this.canvas_holder = $('#cw-canvas-holder');
        this.canvas = $('#cw-canvas');
        this.context = this.canvas[0].getContext('2d');

        this.hidden_input = $('#hidden-input');

        this.reveal_letter = $('#reveal-letter')
        this.reveal_word = $('#reveal-word')
        this.reveal_puzzle = $('#reveal-puzzle')

        this.check_letter = $('#check-letter')
        this.check_word = $('#check-word')
        this.check_puzzle = $('#check-puzzle')

        this.save_btn = $('#file-save')

        this.timer_button = $('#timer-button')

        this.success_bar = $('#finish-success')
        this.success_bar.hide()

        this.warning_bar = $('#finish-warning')
        this.warning_bar.hide()

        this.grid_is_finished = false;
        this.need_increment = true;
        this.can_submit_score = true;

        // preload one puzzle
        if (this.config.puzzle_file && this.config.puzzle_file.hasOwnProperty('url') && this.config.puzzle_file.hasOwnProperty('type')) {
            var loaded_callback;
            switch (this.config.puzzle_file.type) {
                case FILE_PUZ:
                    loaded_callback = parsePUZ_callback;
            }
            loadFileFromServer(this.config.puzzle_file.url, this.config.puzzle_file.type).then(loaded_callback, error_callback);
        }
    };

    CrossWord.prototype.error = function(message) {
        alert(message);
    };

    CrossWord.prototype.parsePUZPuzzle = function(string) {
        var puzzle = PUZAPP.parsepuz(string);
        this.title = ''; this.author = ''; this.copyright = '';

        if (puzzle.title.length) {
            this.title = puzzle.title;
            var text = this.title;
            if (puzzle.author.length) {
                this.author = puzzle.author;
                text += "<br>" + this.author;
            }
            if (puzzle.copyright.length) {
                this.copyright = puzzle.copyright;
                text += "<br>" + this.copyright;
            }
        }

        this.grid_width = puzzle.width;
        this.grid_height = puzzle.height;

        this.cells = {};
        for (var x = 0; x < puzzle.width; x++) {
            for (var y = 0; y < puzzle.height; y++) {
                if (!this.cells[x + 1]) {
                    this.cells[x + 1] = {};
                }
                var thisIndex = y * puzzle.width + x;
                var solutionLetter = puzzle.solution.charAt(thisIndex);
                var myShape = puzzle.circles[thisIndex] ? 'circle' : null;
                this.cells[x + 1][y + 1] = {
                    x: x + 1,
                    y: y + 1,
                    solution: solutionLetter != '.' ? solutionLetter : null,
                    number: puzzle.sqNbrs[thisIndex],
                    color: null,
                    shape: myShape,
                    empty: solutionLetter == '.',
                    letter: null,
                };
            }
        }

        var acrossClueWordIdBase = 1000;
        var downClueWordIdBase = 2000;

        var acrossClueList = Object.entries(puzzle.across_clues).map(function(entry) {
            return {
                word: (acrossClueWordIdBase + parseInt(entry[0])).toString(),
                number: entry[0].toString(),
                text: entry[1],
            };
        });
        this.clues_top = new CluesGroup(this, {
            id: CLUES_TOP,
            title: "<b>Horizontalement</b>",
            clues: acrossClueList,
            words_ids: Object.keys(puzzle.across_clues).map(function(key) {
                return (acrossClueWordIdBase + parseInt(key)).toString();
            }),
        });
        var downClueList = Object.entries(puzzle.down_clues).map(function(entry) {
            return {
                word: (downClueWordIdBase + parseInt(entry[0])).toString(),
                number: entry[0].toString(),
                text: entry[1],
            };
        });
        this.clues_bottom = new CluesGroup(this, {
            id: CLUES_BOTTOM,
            title: "<b>Verticalement</b>",
            clues: downClueList,
            words_ids: Object.keys(puzzle.down_clues).map(function(key) {
                return (downClueWordIdBase + parseInt(key)).toString();
            }),
        });

        var wordCellRanges = {};
        for (var x = 0; x < puzzle.width; x++) {
            for (var y = 0; y < puzzle.height; y++) {
                var acrossWordNumber = puzzle.acrossWordNbrs[y * puzzle.width + x];
                if (acrossWordNumber != 0) {
                    if (!wordCellRanges[acrossClueWordIdBase + acrossWordNumber]) {
                        wordCellRanges[acrossClueWordIdBase + acrossWordNumber] = [];
                    }
                    wordCellRanges[acrossClueWordIdBase + acrossWordNumber].push({
                        x: (x + 1).toString(),
                        y: (y + 1).toString(),
                    });
                }

                var downWordNumber = puzzle.downWordNbrs[y * puzzle.width + x];
                if (downWordNumber != 0) {
                    if (!wordCellRanges[downClueWordIdBase + downWordNumber]) {
                        wordCellRanges[downClueWordIdBase + downWordNumber] = [];
                    }
                    wordCellRanges[downClueWordIdBase + downWordNumber].push({
                        x: (x + 1).toString(),
                        y: (y + 1).toString(),
                    });
                }
            }
        }
        this.words = {};
        for (var i = 0; i < puzzle.acrossSqNbrs.length; i++) {
            var id = (acrossClueWordIdBase + puzzle.acrossSqNbrs[i]).toString();
            this.words[id] = new Word(this, {
                id: id,
                cell_ranges: wordCellRanges[id],
                clue: acrossClueList[i],
            });
        }
        for (var i = 0; i < puzzle.downSqNbrs.length; i++) {
            var id = (downClueWordIdBase + puzzle.downSqNbrs[i]).toString();
            this.words[id] = new Word(this, {
                id: id,
                cell_ranges: wordCellRanges[id],
                clue: downClueList[i],
            });
        }

        this.loadPuzzle();

        this.completeLoad();
    }

    CrossWord.prototype.completeLoad = function() {

        // Render clues if clue boxes exist
        if (this.clues_top) {
            this.renderClues(this.clues_top, this.clues_top_container);
        }
        if (this.clues_bottom) {
            this.renderClues(this.clues_bottom, this.clues_bottom_container);
        }

        // If grid is not finished
        // Add listeners
        // Select first word as active clue
        if(!this.grid_is_finished){
            this.changeActiveClues();
            this.addListeners();
        }

        var first_word = this.active_clues.getFirstWord();
        this.setActiveWord(first_word);
        this.setActiveCell(first_word.getFirstCell());

        this.renderCells();
    }

    CrossWord.prototype.remove = function() {
        this.removeListeners();
    };

    CrossWord.prototype.removeGlobalListeners = function() {
        $(window).off('resize', this.render_cells_callback);
    };

    CrossWord.prototype.removeListeners = function() {
        this.removeGlobalListeners();
        this.clues_top_container.undelegate('div.cw-clues-items span');
        this.clues_bottom_container.undelegate('div.cw-clues-items span');
        this.canvas.off('mousemove click');

        this.reveal_letter.off('click');
        this.reveal_word.off('click');
        this.reveal_puzzle.off('click');

        this.check_letter.off('click');
        this.check_word.off('click');
        this.check_puzzle.off('click');

        this.save_btn.off('click');

        this.hidden_input.off('input');
        this.hidden_input.off('keydown');
    };

    CrossWord.prototype.addListeners = function() {
        $(window).on('resize', this.render_cells_callback);

        // CLUES
        // Across column
        this.clues_top_container.delegate('div.cw-clues-items div.cw-clue', 'mouseenter', $.proxy(this.mouseEnteredClue, this));
        this.clues_top_container.delegate('div.cw-clues-items div.cw-clue', 'mouseleave', $.proxy(this.mouseLeftClue, this));
        this.clues_top_container.delegate('div.cw-clues-items div.cw-clue', 'click', $.proxy(this.clueClicked, this));

        // Down column
        this.clues_bottom_container.delegate('div.cw-clues-items div.cw-clue', 'mouseenter', $.proxy(this.mouseEnteredClue, this));
        this.clues_bottom_container.delegate('div.cw-clues-items div.cw-clue', 'mouseleave', $.proxy(this.mouseLeftClue, this));
        this.clues_bottom_container.delegate('div.cw-clues-items div.cw-clue', 'click', $.proxy(this.clueClicked, this));

        this.canvas.on('click', $.proxy(this.mouseClicked, this));

        // REVEAL
        this.reveal_letter.on('click', $.proxy(this.check_reveal, this, 'letter', 'reveal'));
        this.reveal_word.on('click', $.proxy(this.check_reveal, this, 'word', 'reveal'));
        this.reveal_puzzle.on('click', $.proxy(this.check_reveal, this, 'puzzle', 'reveal'));

        // CHECK
        this.check_letter.on('click', $.proxy(this.check_reveal, this, 'letter', 'check'));
        this.check_word.on('click', $.proxy(this.check_reveal, this, 'word', 'check'));
        this.check_puzzle.on('click', $.proxy(this.check_reveal, this, 'puzzle', 'check'));

        // FILE
        this.save_btn.on('click', $.proxy(this.savePuzzle, this));

        this.hidden_input.on('input', $.proxy(this.hiddenInputChanged, this, null));
        this.hidden_input.on('keydown', $.proxy(this.keyPressed, this));
    };

    // Function to switch the clues, generally from "ACROSS" to "DOWN"
    CrossWord.prototype.changeActiveClues = function() {
        if (!this.clues_bottom) {
            this.active_clues = this.clues_top;
            this.inactive_clues = this.clues_top;
            if (this.selected_cell) {
                var new_word = this.active_clues.getMatchingWord(this.selected_cell.x, this.selected_cell.y, true);
                this.setActiveWord(new_word);
            }
        }
        else if (this.active_clues && this.active_clues.id === CLUES_TOP) {
            // check that there are inactive clues to switch to
            if (this.inactive_clues !== null)
            {
                this.active_clues = this.clues_bottom;
                this.inactive_clues = this.clues_top;
            }
        } else {
            this.active_clues = this.clues_top;
            this.inactive_clues = this.clues_bottom;
        }
    };

    CrossWord.prototype.getCell = function(x, y) {
        return this.cells[x] ? this.cells[x][y] : null;
    };

    CrossWord.prototype.setActiveWord = function(word) {
        if (word) {
            this.selected_word = word;
            this.top_text.html(word.clue.number + '. ' + word.clue.text);
        }
    };

    CrossWord.prototype.setActiveCell = function(cell) {
        var offset = this.canvas.offset(), input_top, input_left;
        if (cell && !cell.empty) {
            this.selected_cell = cell;
            this.active_clues.markActive(cell.x, cell.y, false);
            this.inactive_clues.markActive(cell.x, cell.y, true);

            input_top = offset.top + ((cell.y-1)*this.cell_size);
            input_left = offset.left + ((cell.x-1)*this.cell_size);

            this.hidden_input.css({left: input_left, top: input_top});
            this.hidden_input.focus();
        }
    };

    CrossWord.prototype.renderClues = function(clues_group, clues_container) {
        var i, clue, clue_el,
            items = clues_container.find('div.cw-clues-items');
        items.find('div.cw-clue').remove();
        for (i=0; clue = clues_group.clues[i]; i++) {
            clue_el = $('<div>'+clue.number+'. '+clue.text+'</div>');
            clue_el.data('word', clue.word);
            clue_el.data('number', clue.number);
            clue_el.data('clues', clues_group.id);
            clue_el.addClass('cw-clue');
            clue_el.addClass('word-'+clue.word);
            items.append(clue_el);
        }
        clues_group.clues_container = items;
    };

    // Clears canvas and re-renders all cells
    CrossWord.prototype.renderCells = function() {
        var x, y;

        if (Number(this.config.cell_size) === 0) {
            var max_height = this.canvas_holder.height();
            var max_width = this.canvas_holder.width();
            this.cell_size = Math.min(Math.floor(max_width/this.grid_width), 75)
        } else {
            this.cell_size = Number(this.config.cell_size);
        }

        // Scale the grid so it is crisp on high-density screens.
        var widthDps = this.grid_width * this.cell_size - 1 + 6;
        var heightDps = this.grid_height * this.cell_size - 1 + 6;
        var devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas[0].width = devicePixelRatio * widthDps;
        this.canvas[0].height = devicePixelRatio * heightDps;
        this.canvas[0].style.width = widthDps + "px";
        this.canvas[0].style.height = heightDps + "px";
        this.context.scale(devicePixelRatio, devicePixelRatio);

        this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
        this.context.fillRect(0, 0, this.canvas[0].width, this.canvas[0].height);
        this.context.fillStyle = this.config.color_block;

        for(x in this.cells) {
            for (y in this.cells[x]) {
                var cell = this.cells[x][y],
                    cell_x = (x-1)*this.cell_size +3,
                    cell_y = (y-1)*this.cell_size +3;

                if (!cell.empty) {
                    // detect cell color
                    var color = cell.color || this.config.color_none;
                    if (this.hilited_word && this.hilited_word.hasCell(cell.x, cell.y)) {color = this.config.color_hilite;}
                    if (this.selected_word && this.selected_word.hasCell(cell.x, cell.y)) {color = this.config.color_word;}
                    if (this.selected_cell && x == this.selected_cell.x && y == this.selected_cell.y) {color = this.config.color_selected;}
                    this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
                    
                    this.context.fillStyle = color;
                    this.context.fillRect(cell_x, cell_y, this.cell_size-1, this.cell_size-1);
                    this.context.fillStyle = this.config.color_block;
                    
                    // Draw a line on the left and top
                    if (x > 0 && y > 0) {
                        this.context.beginPath();
                        this.context.lineWidth = 1;
                        this.context.moveTo(cell_x, cell_y);
                        this.context.lineTo(cell_x, cell_y + this.cell_size);
                        this.context.stroke();
                        this.context.beginPath();
                        this.context.moveTo(cell_x, cell_y);
                        this.context.lineTo(cell_x + this.cell_size, cell_y);
                        this.context.stroke();
                    }
                    
                } else {
                    if (cell.is_void || cell.clue) {
                        this.context.fillStyle = this.config.color_none;
                    }
                    else {
                        // respect cell coloring, even for blocks
                        this.context.fillStyle = cell.color || this.config.color_block;
                    }
                    this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
                    this.context.fillStyle = this.config.color_block;
                }

                if (cell.shape === 'circle') {
                    var centerX = cell_x + (this.cell_size - 1)/2;
                    var centerY = cell_y + (this.cell_size - 1)/2;
                    var radius = (this.cell_size - 1)/2;
                    this.context.beginPath();
                    this.context.arc(centerX,centerY,radius,0,2 * Math.PI,false);
                    this.context.stroke();
                }

                if (cell.bar) {
                    var bar_start = {
                        top : [cell_x, cell_y]
                    ,    left : [cell_x, cell_y]
                    ,    right : [cell_x + this.cell_size, cell_y + this.cell_size]
                    ,    bottom : [cell_x + this.cell_size, cell_y + this.cell_size]
                    };
                    var bar_end = {
                        top : [cell_x + this.cell_size, cell_y]
                    ,    left : [cell_x, cell_y + this.cell_size]
                    ,    right : [cell_x + this.cell_size, cell_y]
                    ,    bottom : [cell_x, cell_y + this.cell_size]
                    };
                    for (var key in cell.bar) {
                        if (cell.bar.hasOwnProperty(key)) {
                            // key is top, bottom, etc.
                            // cell.bar[key] is true or false
                            if (cell.bar[key]) {
                                this.context.beginPath();
                                this.context.moveTo(bar_start[key][0],bar_start[key][1]);
                                this.context.lineTo(bar_end[key][0],bar_end[key][1]);
                                this.context.lineWidth = 5;
                                this.context.stroke();
                                this.context.lineWidth = 1;
                            }
                        }
                    }
                }


                if (cell.number) {
                    this.context.font = Math.ceil(this.cell_size/4)+"px sans-serif";
                    this.context.textAlign = "left";
                    this.context.textBaseline = "top";
                    this.context.fillText(
                      cell.number,
                      Math.floor(cell_x+this.cell_size*0.1),
                      Math.floor(cell_y+this.cell_size*0.1)
                    );
                }
                
                if (cell.top_right_number) {
                    this.context.font = Math.ceil(this.cell_size/4)+"px sans-serif";
                    this.context.textAlign = "right";
                    this.context.textBaseline = "top";
                    this.context.fillText(
                      cell.top_right_number,
                      Math.floor(cell_x+this.cell_size*0.9),
                      Math.floor(cell_y+this.cell_size*0.1)
                    );
                }
               
                if (cell.letter) {
                    var cell_letter_length = cell.letter.length;
                    this.context.font = this.cell_size/(1.5 + 0.5 * cell_letter_length) +"px sans-serif";
                    if (cell.revealed) {
                        this.context.font = 'bold italic ' + this.context.font;
                    }
                    if (cell.checked) {
                        this.context.beginPath();
                        this.context.moveTo(cell_x, cell_y);
                        this.context.lineTo(cell_x + this.cell_size, cell_y + this.cell_size);
                        //this.context.lineWidth = 5;
                        this.context.stroke();
                    }
                    this.context.textAlign = "center";
                    this.context.textBaseline = "middle";
                    this.context.fillText(cell.letter, cell_x+this.cell_size/2, cell_y+ 2 * this.cell_size/3);
                }
            }
        }
    };

    CrossWord.prototype.mouseClicked = function(e) {
        var offset = this.canvas.offset(),
            mouse_x = e.pageX - offset.left,
            mouse_y = e.pageY - offset.top,
            index_x = Math.ceil(mouse_x / this.cell_size),
            index_y = Math.ceil(mouse_y / this.cell_size);

        if (this.selected_cell && this.selected_cell.x == index_x && this.selected_cell.y == index_y) {
            this.changeActiveClues();
        }

        if (this.active_clues.getMatchingWord(index_x, index_y)) {
            this.setActiveWord(this.active_clues.getMatchingWord(index_x, index_y));
        }
        else {
            this.setActiveWord(this.inactive_clues.getMatchingWord(index_x, index_y));
        }
        this.setActiveCell(this.getCell(index_x, index_y));
        this.renderCells();
    };

    CrossWord.prototype.keyPressed = function(e) {
        var prevent = [35, 36, 37, 38, 39, 40, 32, 46, 8, 9, 13].indexOf(e.keyCode) >= 0; // to prevent event propagation for specified keys
        switch (e.keyCode) {
            case 35: // end
                this.moveToFirstCell(true);
                break;
            case 36: // home
                this.moveToFirstCell(false);
                break;
            case 37: // left
                if (e.shiftKey) {
                    this.skipToWord(SKIP_LEFT);
                } else {
                    this.moveSelectionBy(-1, 0);
                }
                break;
            case 38: // up
                if (e.shiftKey) {
                    this.skipToWord(SKIP_UP);
                } else {
                    this.moveSelectionBy(0, -1);
                }
                break;
            case 39: // right
                if (e.shiftKey) {
                    this.skipToWord(SKIP_RIGHT);
                } else {
                    this.moveSelectionBy(1, 0);
                }
                break;
            case 40: // down
                if (e.shiftKey) {
                    this.skipToWord(SKIP_DOWN);
                } else {
                    this.moveSelectionBy(0, 1);
                }
                break;
            case 32: //space
                if (this.selected_cell && this.selected_word) {
                    this.selected_cell.letter = "";
                    this.selected_cell.checked = false;
                    var next_cell = this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
                    this.setActiveCell(next_cell);
                }
                this.renderCells();
                break;
            case 27: // escape -- pulls up a rebus entry
                if (this.selected_cell && this.selected_word) {
                    var rebus_entry = prompt("Rebus entry", "");
                    this.hiddenInputChanged(rebus_entry);
                }
                break;
            case 45: // insert -- same as escape
                if (this.selected_cell && this.selected_word) {
                    var rebus_entry = prompt("Rebus entry", "");
                    this.hiddenInputChanged(rebus_entry);
                }
                break;
            case 46: // delete
                if (this.selected_cell) {
                    this.selected_cell.letter = "";
                    this.selected_cell.checked = false;
                }
                this.renderCells();
                break;
            case 8:  // backspace
                if (this.selected_cell && this.selected_word) {
                    this.selected_cell.letter = "";
                    this.selected_cell.checked = false;
                    var prev_cell = this.selected_word.getPreviousCell(this.selected_cell.x, this.selected_cell.y);
                    this.setActiveCell(prev_cell);
                }
                this.renderCells();
                break;
            case 9: // tab
                if (e.shiftKey) {
                    this.moveToNextWord(true);
                } else {
                    this.moveToNextWord(false);
                }
                break;
            case 13: // enter key -- same as tab
                if (e.shiftKey) {
                    this.moveToNextWord(true);
                } else {
                    this.moveToNextWord(false);
                }
                break;
        }
        if (prevent) {
            e.preventDefault();
            e.stopPropagation();
        }
    };
    
    // Detects user inputs to hidden input element
    CrossWord.prototype.hiddenInputChanged = function(rebus_string) {
        var mychar = this.hidden_input.val().slice(0, 1).toUpperCase(),
            next_cell;
        if (this.selected_word && this.selected_cell) {
            if (mychar) {
                this.selected_cell.letter = mychar;
            }
            else if (rebus_string) {
                this.selected_cell.letter = rebus_string.toUpperCase();
            }
            this.selected_cell.checked = false;
            
            // find empty cell, then next cell
            // Change this depending on config
            if (this.config.skip_filled_letters) {
                next_cell = this.selected_word.getFirstEmptyCell(this.selected_cell.x, this.selected_cell.y) || this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
            }
            else {
                next_cell = this.selected_word.getNextCell(this.selected_cell.x, this.selected_cell.y);
            }

            this.setActiveCell(next_cell);
            this.renderCells();
            this.checkIfSolved();
        }
        this.hidden_input.val('');
    };

    CrossWord.prototype.checkIfSolved = function() {
        var i, j, cell, is_finished=true;
        for(i in this.cells) {
            for(j in this.cells[i]) {
                cell = this.cells[i][j];
                // if found cell without letter or with incorrect letter - return
                if (!cell.empty && !cell.letter) {
                    return;
                }

                if (!cell.empty && firstChar(cell.letter) != firstChar(cell.solution)) {
                    is_finished=false;
                }
            }
        }

        if(!is_finished){
            this.warning_bar.show();
            return;
        }

        // Puzzle is solved!  Stop the timer and show a message.
        this.grid_is_finished = true;

        if (this.timer_running) {
            clearTimeout(xw_timer);
            this.timer_button.removeClass('running');
            this.timer_running = false;
        }

        // Display success bar and hide warning bar if it was displayed
        this.warning_bar.hide();
        this.success_bar.show();

        // Send POST when solved to increment solve count
        if(this.need_increment) {
            $.ajax(
                {
                    type: 'POST',
                    url: '',
                    data: {'increment': true},
                }
            );
            this.need_increment = false;
        }

        // If able to submit score (did not check or reveal)
        // display modal
        // Make modal button clickable
        if (this.can_submit_score) {
            $('#submitModal').modal('show');
            $('#open-modal-button').removeClass('btn-secondary').addClass('btn-primary');
            $('#open-modal-button').attr("data-target", "#submitModal");
        }

    };

    // callback for shift+arrows
    // finds next cell in specified direction that does not belongs to current word
    // then selects that word and selects it's first empty || first cell
    CrossWord.prototype.skipToWord = function(direction) {
        if (this.selected_cell && this.selected_word) {
            var i, cell, word, word_cell,
                x = this.selected_cell.x,
                y = this.selected_cell.y;

            var cellFound = function(cell) {
                if (cell && !cell.empty) {
                    word = this.active_clues.getMatchingWord(cell.x, cell.y);
                    if (word && word.id !== this.selected_word.id) {
                        word_cell = word.getFirstEmptyCell() || word.getFirstCell();
                        this.setActiveWord(word);
                        this.setActiveCell(word_cell);
                        this.renderCells();
                        return true;
                    }
                }
                return false;
            }.bind(this);

            switch (direction) {
                case SKIP_UP:
                    for (i=y-1;i>=0;i--) {
                        cell = this.getCell(x, i);
                        if (cellFound(cell)) {return;}
                    }
                    break;
                case SKIP_DOWN:
                    for (i=y+1;i<=this.grid_height;i++) {
                        cell = this.getCell(x, i);
                        if (cellFound(cell)) {return;}
                    }
                    break;
                case SKIP_LEFT:
                    for (i=x-1;i>=0;i--) {
                        cell = this.getCell(i, y);
                        if (cellFound(cell)) {return;}
                    }
                    break;
                case SKIP_RIGHT:
                    for (i=x+1;i<=this.grid_width;i++) {
                        cell = this.getCell(i, y);
                        if (cellFound(cell)) {return;}
                    }
                    break;
            }
        }
    };

    CrossWord.prototype.moveToNextWord = function(to_previous) {
        if (this.selected_word) {
            var next_word = to_previous ? this.active_clues.getPreviousWord(this.selected_word) : this.active_clues.getNextWord(this.selected_word),
                cell;
            if (next_word) {
                cell = next_word.getFirstEmptyCell() || next_word.getFirstCell();
                this.setActiveWord(next_word);
                this.setActiveCell(cell);
                this.renderCells();
            }
        }
    };

    CrossWord.prototype.moveToFirstCell = function(to_last) {
        if (this.selected_word) {
            var cell = to_last ? this.selected_word.getLastCell() : this.selected_word.getFirstCell();
            if (cell) {
                this.setActiveCell(cell);
                this.renderCells();
            }
        }
    };

    // callback for arrow keys - moves selection by one cell
    // can change direction
    CrossWord.prototype.moveSelectionBy = function(delta_x, delta_y, jumping_over_black) {
        var x, y, new_cell;
        if (this.selected_cell) {
            x = this.selected_cell.x+delta_x;
            y = this.selected_cell.y+delta_y;
            new_cell = this.getCell(x, y);

            if (!new_cell) {
                /* If we can't find a new cell, we do nothing. */
                //this.changeActiveClues();
                return;
            }

            // try to jump over empty cell
            if (new_cell.empty) {
                if (delta_x < 0) {
                    delta_x--;
                } else if (delta_x > 0) {
                    delta_x++;
                } else if (delta_y < 0) {
                    delta_y--;
                } else if (delta_y > 0) {
                    delta_y++;
                }
                this.moveSelectionBy(delta_x, delta_y, true);
                return;
            }

            // If the new cell is not in the current word
            if (!this.selected_word.hasCell(x, y)) {
                // If the selected cell and the new cell are in the same word, we switch directions
                // We make sure that there is such a word as well (i.e. both are not null)
                if (this.inactive_clues.getMatchingWord(this.selected_cell.x, this.selected_cell.y, true).hasCell(new_cell.x, new_cell.y) && this.inactive_clues.getMatchingWord(new_cell.x, new_cell.y, true) !== null) {
                    this.changeActiveClues();
                    // if cell empty - keep current cell selected
                    if (!this.selected_cell.letter) {
                        new_cell = this.selected_cell;
                    }
                }
                // In any case we change the active word
                this.setActiveWord(this.active_clues.getMatchingWord(new_cell.x, new_cell.y));
            }
            this.setActiveCell(new_cell);
            this.renderCells();
        }
    };

    CrossWord.prototype.mouseEnteredClue = function(e) {
        var target = $(e.currentTarget);
        this.hilited_word = this.words[target.data('word')];
        this.renderCells();
    };

    CrossWord.prototype.mouseLeftClue = function() {
        this.hilited_word = null;
        this.renderCells();
    };

    CrossWord.prototype.clueClicked = function(e) {
        var target = $(e.currentTarget),
            word = this.words[target.data('word')],
            cell = word.getFirstEmptyCell() || word.getFirstCell();
        if (cell) {
            this.setActiveWord(word);
            if (this.active_clues.id !== target.data('clues')) {
                this.changeActiveClues();
            }
            this.setActiveCell(cell);
            this.renderCells();
        }
    };

    CrossWord.prototype.check_reveal = function(to_solve, reveal_or_check, e) {
        this.can_submit_score = false;

        var my_cells = [], cell;
        switch (to_solve) {
            case 'letter' :
                if (this.selected_cell) {
                    my_cells = [this.selected_cell];
                }
                break;
            case 'word' :
                if (this.selected_word) {
                    var i, coordinates, cell;
                    for (i=0; coordinates = this.selected_word.cells[i]; i++) {
                        cell = this.selected_word.getCellByCoordinates(coordinates);
                        if (cell) {
                            my_cells.push(cell);
                        }
                    }
                }
                break;
            case 'puzzle' :
                var i, j, cell;
                for (i in this.cells) {
                    for (j in this.cells[i]) {
                        cell = this.cells[i][j];
                        my_cells.push(cell);
                    }
                }
                break;
        }
        
        for (var i = 0; i < my_cells.length; i++) {
            if (firstChar(my_cells[i].letter) != firstChar(my_cells[i].solution)) {
                if (reveal_or_check == 'reveal') {
                    my_cells[i].letter = my_cells[i].solution;
                    my_cells[i].revealed = true;
                    my_cells[i].checked = false;
                }
                else if (reveal_or_check == 'check') {
                    my_cells[i].checked = true;
                }
            }
        }
        this.renderCells();
        if (reveal_or_check == 'reveal') {
            this.checkIfSolved();
        }

        this.hidden_input.focus();
        e.preventDefault();
        e.stopPropagation();
    }

    // save cells of puzzle
    CrossWord.prototype.savePuzzle = function() {
        var savegame = {
            cells: this.cells,
            time: xw_timer_seconds,
            score_status: this.can_submit_score,
            is_finished: this.grid_is_finished,
        };

        var savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
        localStorage.setItem(savegame_name, JSON.stringify(savegame));
        alert(MSG_SAVED);
    };

    // loads saved puzzle
    CrossWord.prototype.loadPuzzle = function() {
        var savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
        var savegame = JSON.parse(localStorage.getItem(savegame_name));

        if (savegame && savegame.hasOwnProperty('cells'))
        {
            this.cells = savegame.cells;
            this.renderCells();
        }

        if (savegame && savegame.hasOwnProperty('time')){
            xw_timer_seconds = savegame.time
        }

        if (savegame && savegame.hasOwnProperty('score_status')){
            this.can_submit_score = savegame.score_status
        }

        if (savegame && savegame.hasOwnProperty('is_finished')){
            this.grid_is_finished = savegame.is_finished
        }

        if(this.can_submit_score){
            $('#open-modal-button').removeClass('btn-secondary').addClass('btn-primary');
            $('#open-modal-button').attr("data-target", "#submitModal");
        }

    };

    CrossWord.prototype.toggleTimer = function() {
        var display_seconds, display_minutes;
        var timer_btn = this.timer_button;

        function add() {
            xw_timer_seconds = xw_timer_seconds + 1;
            display_seconds = xw_timer_seconds % 60;
            display_minutes = (xw_timer_seconds - display_seconds) / 60;

            var display = (display_minutes ? (display_minutes > 9 ? display_minutes : "0" + display_minutes) : "00") + ":" + (display_seconds > 9 ? display_seconds : "0" + display_seconds);

            timer_btn.html(display);

            timer();
        }

        function timer() {
            xw_timer = setTimeout(add, 1000);
        }

        if (this.timer_running) {
            // Stop the timer
            clearTimeout(xw_timer);
            timer_btn.removeClass('running');
            this.timer_running = false;
            this.hidden_input.focus();
        }
        else {
            // Start the timer
            this.timer_running = true;
            timer_btn.addClass('running');
            this.hidden_input.focus();
            timer();
        }

    }

    CrossWord.prototype.getTime = function() {
        return xw_timer_seconds;
    }

    if ( typeof define === "function" && define.amd ) {
        define( "CrosswordNexus", [], function() {
            return CrosswordNexus;
        });
    }

    if (registerGlobal) {
        window.CrosswordNexus = CrosswordNexus;
    }
    return CrosswordNexus;
}));
