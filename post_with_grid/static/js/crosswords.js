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

    var default_config = {
        hover_enabled: false,
        color_hover: "#FFFFAA",
        color_selected: "#FF0000",
        color_word: "#FFFF00",
        color_hilite: "#FFFCA5",
        color_none: "#FFFFFF",
        color_block: "#000000",
        cell_size: null, // null or anything converts to 0 means 'auto'
        puzzle_file: null,
        puzzles: null,
        skip_filled_letters: true,
        savegame_name: ''
    };

    // constants
    var FILE_JPZ = 'jpz';
    var FILE_PUZ = 'puz';
    var CLUES_TOP = "clues_top";
    var CLUES_BOTTOM = "clues_bottom";
    var MIN_SIZE = 10;
    var MAX_SIZE = 100;
    var SKIP_UP = 'up';
    var SKIP_DOWN = 'down';
    var SKIP_LEFT = 'left';
    var SKIP_RIGHT = 'right';
    var STORAGE_KEY = 'crossword_nexus_savegame';
    var SETTINGS_STORAGE_KEY = 'crossword_nexus_settings';

    // messages
    var MSG_SAVED = 'Crossword saved';
    var MSG_LOADED = 'Crossword loaded';
    var MSG_SOLVED = 'Crossword solved! Congratulations!';

    var SIZE_BIG = 'big';
    var SIZE_NORMAL = 'normal';
    var SIZE_SMALL = 'small';
    var SIZE_TINY = 'tiny';

    var BIG_THRESHOLD = 700;
    var NORMAL_THRESHOLD = 580;
    var SMALL_THRESHOLD = 450;
    
    var MAX_CLUES_LENGTH = 2;

    var TYPE_UNDEFINED = typeof undefined;
    var XMLDOM_ELEMENT = 1;
    var XMLDOM_TEXT = 3;
    var ZIPJS_CONFIG_OPTION = 'zipjs_path';
    var ZIPJS_PATH = 'lib/zip';

    // errors
    var ERR_FILE_LOAD     = 'Error loading file';
    var ERR_UNZIP         = 'Failed to unzip file';
    var ERR_PARSE_JPZ     = 'Error parsing JPZ file... Not JPZ or zipped JPZ file.';
    var ERR_NOT_CROSSWORD = 'Error opening file. Probably not a crossword.';
    var ERR_NO_JQUERY     = 'jQuery not found';
    var ERR_CLUES_GROUPS  = 'Wrong number of clues in jpz file';
    var ERR_NO_ZIPJS      = 'Zip js not found';
    var ERR_NO_PUZJS      = 'Puz js not found';
    var ERR_LOAD          = 'Error loading savegame - probably corrupted';
    var ERR_NO_SAVEGAME   = 'No saved game found';

    var load_error = false;

    var CROSSWORD_TYPES = ['crossword', 'coded', 'acrostic'];
    
    var xw_timer, xw_timer_seconds = 0;

    var template = '' +
    '<div class="cw-main auto normal">'+
        '<div class="cw-full-height"></div>'+
        '<input type="text" class="cw-hidden-input"' +
        ' style="opacity: 0; position: fixed; top: -100px; left: -100px; width: 0; height: 0; z-index: -1;">'+
        '<div class="row">' +
            '<div class="cw-canvas col-xl-8">'+
                '<canvas></canvas>'+
            '</div>'+
        '</div>'+
    '</div>';

    // returns deferred object
    function loadFileFromServer(path, type) {
        var xhr = new XMLHttpRequest(),
            deferred = $.Deferred();
        xhr.open('GET', path);
        xhr.responseType = 'blob';
        xhr.onload = function() {
            if (xhr.status == 200) {
                loadFromFile(xhr.response, type, deferred);
            } else {
                deferred.reject(ERR_FILE_LOAD);
            }
        };
        xhr.send();
        return deferred;
    }
    
    // Check if we can drag and drop files
    var isAdvancedUpload = function() {
      var div = document.createElement('div');
      return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();

    function loadFromFile(file, type, deferred) {
        var reader = new FileReader();
        deferred = deferred || $.Deferred();
        reader.onload = function(event) {
            var string = event.target.result;
            if (type === FILE_JPZ) {
                if (string.match(/^<\?xml/)) { // xml
                    parseJPZString(event.target.result, deferred);
                } else { // probably, zipped xml
                    unzip(new zip.TextReader(file), parseJPZString, deferred);
                }
            } else if (type === FILE_PUZ) {
                deferred.resolve(string);
            }
        };
        if (type === FILE_PUZ) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
        return deferred;
    }

    function unzip(zip_reader, success_callback, deferred) {
        zip.workerScripts = {'inflater': [ZIPJS_PATH+'/z-worker.js', ZIPJS_PATH+'/inflate.js']};
        // use a BlobReader to read the zip from a Blob object
        zip.createReader(zip_reader, function(reader) {
            // get all entries from the zip
            reader.getEntries(function(entries) {
                if (entries.length) {
                    // get first entry content as text
                    entries[0].getData(new zip.TextWriter(), function(text) {
                        // text contains the entry data as a String
                        if (typeof success_callback === 'function') {
                            success_callback(text, deferred);
                        }
                    });
                }
            });
        }, function(error) {
            deferred.reject(ERR_UNZIP);
        });
    }

    // parses XML string and creates DOMParser object
    function parseJPZString(xml_string, deferred) {
        var parser, xmlDoc;
        // Some CS JPZs have &nbsp; in them.  Replace with a space.
        xml_string = xml_string.replace('&nbsp;', ' ');
        if (window.DOMParser) {
            parser=new DOMParser();
            xmlDoc=parser.parseFromString(xml_string,"text/xml");
        } else { // Internet Explorer
            xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async=false;
            xmlDoc.loadXML(xml_string);
        }

        if (xmlDoc.getElementsByTagName('parsererror').length) {
            deferred.reject(ERR_PARSE_JPZ);
            return;
        }

        deferred.resolve(xmlDoc);
    }

    function XMLElementToString(element) {
        var i, node, nodename,
            nodes = element.childNodes,
            result = '';
        for (i=0;node=nodes[i];i++) {
            if (node.nodeType === XMLDOM_TEXT) {
                result += node.textContent;
            }
            if (node.nodeType === XMLDOM_ELEMENT) {
                nodename = node.nodeName;
                result += '<'+nodename+'>'+XMLElementToString(node)+'</'+nodename+'>';
            }

        }
        return result;
    }

    // Return the first element of a string -- if it's null return null
    function firstChar(str) {
        if (str == null) {return null;}
        else {return str.charAt(0);}
    }

    var CrosswordNexus = {
        createCrossword: function(parent, user_config) {
            var crossword;
            try {
                if (typeof jQuery === TYPE_UNDEFINED) {
                    throw new Error(ERR_NO_JQUERY);
                }
                if (typeof zip === TYPE_UNDEFINED) {
                    throw new Error(ERR_NO_ZIPJS);
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
        var parseJPZ_callback = $.proxy(this.parseJPZPuzzle, this);
        var parsePUZ_callback = $.proxy(this.parsePUZPuzzle, this);
        var error_callback = $.proxy(this.error, this);

        if (this.root) {
            this.remove();
        }

        // build structures
        this.root = $(template);
        this.top_text = $('#cw-top-text');
        this.bottom_text = this.root.find('div.cw-bottom-text'); // TODO: Remove bottom text

        this.clues_top_container = $('#cw-clues-top');
        this.clues_bottom_container = $('#cw-clues-bottom');

        this.canvas_holder = $('#cw-canvas-holder');
        this.canvas = $('#cw-canvas');
        this.context = this.canvas[0].getContext('2d');

        this.hidden_input = this.root.find('input.cw-hidden-input'); //TODO: Remove hidden input from template

        this.reveal_letter = $('#reveal-letter')
        this.reveal_word = $('#reveal-word')
        this.reveal_puzzle = $('#reveal-puzzle')

        this.check_letter = $('#check-letter')
        this.check_word = $('#check-word')
        this.check_puzzle = $('#check-puzzle')

        this.save_btn = $('#file-save')
        this.load_btn = $('#file-load')

        this.timer_button = $('#timer-button')
        
        // function to process uploaded files
        function processFiles(files) {
            if (files[0].name.endsWith(".puz")) {
                loadFromFile(files[0], FILE_PUZ).then(parsePUZ_callback, error_callback);
            } else {
                loadFromFile(files[0], FILE_JPZ).then(parseJPZ_callback, error_callback);
            }
        }

        // preload one puzzle
        if (this.config.puzzle_file && this.config.puzzle_file.hasOwnProperty('url') && this.config.puzzle_file.hasOwnProperty('type')) {
            this.root.addClass('loading');
            var loaded_callback;
            switch (this.config.puzzle_file.type) {
                case FILE_JPZ:
                    loaded_callback = parseJPZ_callback;
                case FILE_PUZ:
                    loaded_callback = parsePUZ_callback;
            }
            loadFileFromServer(this.config.puzzle_file.url, this.config.puzzle_file.type).then(loaded_callback, error_callback);
        }

        // mapping of number to cells
        this.number_to_cells = {};

        // the crossword type
        this.crossword_type = 'crossword';

        this.root.appendTo(this.parent);
    };

    CrossWord.prototype.error = function(message) {
        alert(message);
    };

    CrossWord.prototype.parsePUZPuzzle = function(string) {
        var puzzle = PUZAPP.parsepuz(string);
        this.title = ''; this.author = ''; this.copyright = '';
        this.crossword_type = 'crossword';

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
            this.bottom_text.html(text);
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

        this.completeLoad();
    }

    CrossWord.prototype.parseJPZPuzzle = function(xmlDoc) {
        var crossword, puzzle, metadata, title, creator, copyright;
        puzzle = xmlDoc.getElementsByTagName('rectangular-puzzle');
        if (!puzzle.length) {
            this.error(ERR_PARSE_JPZ);
            return;
        }
        // determine the type of the crossword
        for (var _i=0; _i<CROSSWORD_TYPES.length; _i++) {
            this.crossword_type = CROSSWORD_TYPES[_i];
            crossword = xmlDoc.getElementsByTagName(this.crossword_type);
            if (crossword.length > 0) {
                break;
            }
        }

        if (!crossword.length) {
            this.error(ERR_NOT_CROSSWORD);
            return;
        }

        metadata = puzzle[0].getElementsByTagName('metadata');
        if (!metadata.length) {
            this.error(ERR_PARSE_JPZ);
            return;
        }

        // Check for applet settings
        var applet_settings = xmlDoc.getElementsByTagName('applet-settings');

        if (applet_settings.length) {
            var hidden_reveal_count = 0;
            // If we have applet settings, we try to respect them
            var all_settings = [
                ["reveal-word", "div.cw-reveal-word"],
                ["reveal-letter", "div.cw-reveal-letter"],
                ["solution", "div.cw-reveal-puzzle"]
            ];

            var i; var items = $();
            for (i = 0; i < all_settings.length; i++)
            {
                var elt = applet_settings[0].getElementsByTagName(all_settings[i][0]);
                if (!elt.length)
                {
                    hidden_reveal_count = hidden_reveal_count + 1;
                    var mydiv = all_settings[i][1]
                    items = items.add(mydiv);
                }
            }
            items.css({'display':'none'});
            // Hide the reveal itself if we're hiding all its subelements
            if (hidden_reveal_count == 3)
            {
                $('div.cw-reveal').css({'display':'none'});
            }
        }

        title = metadata[0].getElementsByTagName('title');
        creator = metadata[0].getElementsByTagName('creator');
        copyright = metadata[0].getElementsByTagName('copyright');

        this.title = ''; this.author = ''; this.copyright = '';

        if (title.length) {
            this.title = XMLElementToString(title[0]);
            var text = this.title;
            if (creator.length) {
                this.author = XMLElementToString(creator[0]);
                text += "<br>" + this.author;
            }
            if (copyright.length) {
                this.copyright = XMLElementToString(copyright[0]);
                text += "<br>" + this.copyright;
            }
            this.bottom_text.html(text);
        }

        var description = metadata[0].getElementsByTagName('description');
        if (description.length) {
            description = XMLElementToString(description[0]);
        } else {
            description = '';
        }
        
        // solved message
        var completion = xmlDoc.getElementsByTagName('completion');
        if (completion.length) {
            this.msg_solved = XMLElementToString(completion[0]);
        }
        
        this.parseJPZCrossWord(crossword[0],description);
    };

    // parses crossword element from JPZ file and creates needed objects
    CrossWord.prototype.parseJPZCrossWord = function(crossword,description) {
        var i, cell, word, clues_block,
            grid = crossword.getElementsByTagName('grid')[0],
            grid_look = grid.getElementsByTagName('grid-look')[0],
            xml_cells = grid.getElementsByTagName('cell'),
            xml_words = crossword.getElementsByTagName('word'),
            xml_clues = crossword.getElementsByTagName('clues');

        this.grid_width = Number(grid.getAttribute('width'));
        this.grid_height = Number(grid.getAttribute('height'));
        this.cell_size = grid_look.getAttribute('cell-size-in-pixels');

        // parse cells
        for (i=0; cell=xml_cells[i]; i++) {
            var new_cell = {
                x: Number(cell.getAttribute('x')),
                y: Number(cell.getAttribute('y')),
                solution: cell.getAttribute('solution'),
                number: cell.getAttribute('number'),
                color: cell.getAttribute('background-color'),
                shape: cell.getAttribute('background-shape'),
                empty: (cell.getAttribute('type') === 'block' || cell.getAttribute('type') === 'void' || cell.getAttribute('type') === 'clue'),
                letter: cell.getAttribute('solve-state'),
                top_right_number: cell.getAttribute('top-right-number'),
                is_void: cell.getAttribute('type') === 'void',
                clue: cell.getAttribute('type') === 'clue',
                value: cell.textContent
            };
            
            // maintain the mapping of number -> cells
            if (!this.number_to_cells[new_cell.number]) {
                this.number_to_cells[new_cell.number] = [new_cell];
            }
            else {
                this.number_to_cells[new_cell.number].push(new_cell);
            }
            

            // for barred puzzles
            if (cell.getAttribute('top-bar') || cell.getAttribute('bottom-bar') || cell.getAttribute('left-bar') || cell.getAttribute('right-bar')) {
                new_cell.bar = {
                    top: cell.getAttribute('top-bar') === 'true',
                    bottom : cell.getAttribute('bottom-bar') === 'true',
                    left: cell.getAttribute('left-bar') === 'true',
                    right : cell.getAttribute('right-bar') === 'true'
                }
            }

            if (!this.cells[new_cell.x]) {this.cells[new_cell.x] = {};}
            this.cells[new_cell.x][new_cell.y] = new_cell;
        }

        // parse words
        for (i=0; word=xml_words[i]; i++) {
            var new_word = new Word(this);
            new_word.fromJPZ(word);
            this.words[new_word.id] = new_word;
        }

        // parse clues
        // We handle them differently for coded crosswords
        if (this.crossword_type == 'coded') {
            var across_group = new CluesGroup(this, {id: CLUES_TOP, title: 'ACROSS', clues: [], words_ids: []});
            var down_group = new CluesGroup(this, {id: CLUES_BOTTOM, title: 'DOWN', clues: [], words_ids: []});
            for (i=0; word=xml_words[i]; i++) {
                var id = word.getAttribute('id'),
                x = word.getAttribute('x'),
                y = word.getAttribute('y');
                if (y.indexOf('-') == -1) {
                    // Across clue
                    // We need words_ids and clues
                    across_group.clues.push({word: id, number: id, text: '--'});
                    across_group.words_ids.push(id);
                }
                else {
                    // Down clue
                    down_group.clues.push({word: id, number: id, text: '--'});
                    down_group.words_ids.push(id);
                }
            }
            this.clues_top = across_group; this.clues_bottom = down_group;
            // Also, in a coded crossword, there's no reason to show the clues
            $('div.cw-right').css({'display':'none'});
            $('div.cw-main').css({'margin-right':'0px'});
        }
        else { // not a coded crossword
            var clues_length = xml_clues.length;
            if (clues_length == 1) {
                // hide the bottom clues
                $('div.cw-clues-bottom').css({'display':'none'});
                // Make the top clues take up the whole pane
                $('div.cw-clues-top').css({'bottom': '0%'});
            }
            
            if (xml_clues.length > MAX_CLUES_LENGTH) {
                this.error(ERR_CLUES_GROUPS);
                return;
            }
            for (i=0; clues_block=xml_clues[i]; i++) {
                var group = new CluesGroup(this);
                group.fromJPZ(clues_block);
                if (!this.clues_top) {
                    group.id = CLUES_TOP;
                    this.clues_top = group;
                } else {
                    group.id = CLUES_BOTTOM;
                    this.clues_bottom = group;
                }
            }
        }

        this.completeLoad();
    };

    CrossWord.prototype.completeLoad = function() {
        this.changeActiveClues();

        if (this.clues_top) {
            this.renderClues(this.clues_top, this.clues_top_container);
        }
        if (this.clues_bottom) {
            this.renderClues(this.clues_bottom, this.clues_bottom_container);
        }

        this.addListeners();

        this.root.removeClass('loading');
        this.root.addClass('loaded');

        var first_word = this.active_clues.getFirstWord();
        this.setActiveWord(first_word);
        this.setActiveCell(first_word.getFirstCell());

        this.adjustPaddings();
        this.renderCells();
    }

    CrossWord.prototype.remove = function() {
        this.removeListeners();
        this.root.remove();
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
        this.load_btn.off('click');

        this.timer_button.off('click');

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

        if (this.config.hover_enabled) {
            this.canvas.on('mousemove', $.proxy(this.mouseMoved, this));
        }
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
        this.load_btn.on('click', $.proxy(this.loadPuzzle, this));

        // TIMER
        this.timer_button.on('click', $.proxy(this.toggleTimer, this));

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
            title = clues_container.find('div.cw-clues-title'),
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
        title.html(clues_group.title);
        clues_group.clues_container = items;
    };

    // Clears canvas and re-renders all cells
    CrossWord.prototype.renderCells = function() {
        var x, y;

        this.adjustSize();

        if (Number(this.config.cell_size) === 0) {
            var max_height, max_width;
            this.root.removeClass('fixed');
            this.root.addClass('auto');
            max_height = this.root.height() - (this.top_text_height+this.bottom_text_height) - 6;
            max_width = this.root.width() - 16;
            this.cell_size = Math.min(
              Math.floor(max_height/this.grid_height),
              Math.floor(max_width/this.grid_width)
            );
        } else {
            this.root.removeClass('auto');
            this.root.addClass('fixed');
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

        //this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);
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
                    if (this.config.hover_enabled && x == this.hovered_x && y == this.hovered_y) {color = this.config.color_hover;}
                    if (this.selected_cell && x == this.selected_cell.x && y == this.selected_cell.y) {color = this.config.color_selected;}
                    this.context.fillRect(cell_x, cell_y, this.cell_size, this.cell_size);
                    
                    // In an acrostic, highlight all other cells 
                    // with the same number as the selected cell
                    if (this.crossword_type == 'acrostic' && cell.number == this.selected_cell.number && cell != this.selected_cell) {
                        color = this.config.color_hilite;
                    }
                    
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

    CrossWord.prototype.adjustSize = function() {
        //var size = Math.min(this.root.outerWidth(true), 1.5 * this.root.outerHeight(true));
        var size = this.root.outerWidth(true);
        if (size >= BIG_THRESHOLD && !this.root.hasClass(SIZE_BIG)) {
            this.root.addClass(SIZE_BIG);
            this.root.removeClass(SIZE_NORMAL+' '+SIZE_SMALL+' '+SIZE_TINY);
            this.adjustPaddings();
        } else if (size < BIG_THRESHOLD && size >= NORMAL_THRESHOLD && !this.root.hasClass(SIZE_NORMAL)) {
            this.root.addClass(SIZE_NORMAL);
            this.root.removeClass(SIZE_BIG+' '+SIZE_SMALL+' '+SIZE_TINY);
            this.adjustPaddings();
        } else if (size < NORMAL_THRESHOLD && size >= SMALL_THRESHOLD && !this.root.hasClass(SIZE_SMALL)) {
            this.root.addClass(SIZE_SMALL);
            this.root.removeClass(SIZE_BIG+' '+SIZE_NORMAL+' '+SIZE_TINY);
            this.adjustPaddings();
        } else if (size < SMALL_THRESHOLD && size < SMALL_THRESHOLD && !this.root.hasClass(SIZE_TINY)) {
            this.root.addClass(SIZE_TINY);
            this.root.removeClass(SIZE_BIG+' '+SIZE_NORMAL+' '+SIZE_SMALL);
            this.adjustPaddings();
        }
    };

    CrossWord.prototype.adjustPaddings = function() {
        this.top_text_height = this.top_text.outerHeight(true);
        this.bottom_text_height = this.bottom_text.outerHeight(true);
        this.canvas_holder.css({'padding-top': this.top_text_height, 'padding-bottom': this.bottom_text_height});
    };

    CrossWord.prototype.mouseMoved = function(e) {
        if (this.config.hover_enabled) {
            var offset = this.canvas.offset(),
                mouse_x = e.pageX - offset.left,
                mouse_y = e.pageY - offset.top,
                index_x = Math.ceil(mouse_x / this.cell_size),
                index_y = Math.ceil(mouse_y / this.cell_size);

            if (index_x !== this.hovered_x || index_y !== this.hovered_y) {
                this.hovered_x = index_x;
                this.hovered_y = index_y;
                this.renderCells();
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
        var i, j, cell;
        for(i in this.cells) {
            for(j in this.cells[i]) {
                cell = this.cells[i][j];
                // if found cell without letter or with incorrect letter - return
                if (!cell.empty && (!cell.letter || firstChar(cell.letter) != firstChar(cell.solution))) {
                    return;
                }
            }
        }
        // Puzzle is solved!  Stop the timer and show a message.
        if (this.timer_running) {
            clearTimeout(xw_timer);
            this.timer_button.removeClass('running');
            this.timer_running = false;
        }
        alert(this.msg_solved);
        
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
        else {this.closeCheck();}
        this.hidden_input.focus();
        e.preventDefault();
        e.stopPropagation();
    }

    CrossWord.prototype.savePuzzle = function(e) {
        var i, savegame_name, savegame = {
            cell_size: this.cell_size,
            top_text_height: this.top_text_height,
            bottom_text_height: this.bottom_text_height,
            grid_width: this.grid_width,
            grid_height: this.grid_height,

            bottom_text: this.bottom_text.html(),
            top_clues: {
                id: this.clues_top.id,
                title: this.clues_top.title,
                clues: this.clues_top.clues,
                words_ids: this.clues_top.words_ids
            },
            bottom_clues: {
                id: this.clues_bottom.id,
                title: this.clues_bottom.title,
                clues: this.clues_bottom.clues,
                words_ids: this.clues_bottom.words_ids
            },
            words: {},
            cells: this.cells
        };
        for(i in this.words) {
            if (this.words.hasOwnProperty(i)) {
                savegame.words[i] = {
                    id: this.words[i].id,
                    cell_ranges: this.words[i].cell_ranges,
                    cells: this.words[i].cells,
                    clue: this.words[i].clue
                };
            }
        }

        savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
        localStorage.setItem(savegame_name, JSON.stringify(savegame));
        alert(MSG_SAVED);

        this.closeFile();
        e.preventDefault();
        e.stopPropagation();
    };

    // loads saved puzzle
    CrossWord.prototype.loadPuzzle = function(e) {
        var i, savegame_name, savegame, active_word;
        savegame_name = STORAGE_KEY + (this.config.savegame_name || '');
        savegame = JSON.parse(localStorage.getItem(savegame_name));
        if (savegame && savegame.hasOwnProperty('bottom_text') && savegame.hasOwnProperty('top_clues') && savegame.hasOwnProperty('bottom_clues') && savegame.hasOwnProperty('words') && savegame.hasOwnProperty('cells')
            && savegame.hasOwnProperty('cell_size') && savegame.hasOwnProperty('top_text_height') && savegame.hasOwnProperty('bottom_text_height') && savegame.hasOwnProperty('grid_width') && savegame.hasOwnProperty('grid_height')) {

            this.cell_size = savegame.cell_size;
            this.top_text_height = savegame.top_text_height;
            this.bottom_text_height = savegame.bottom_text_height;
            this.grid_width = savegame.grid_width;
            this.grid_height = savegame.grid_height;

            this.bottom_text.html(savegame.bottom_text);

            this.selected_cell = null;
            this.selected_word = null;

            // restore words
            this.words = {};
            for (i in savegame.words) {
                if (savegame.words.hasOwnProperty(i)) {
                    this.words[i] = new Word(this, savegame.words[i]);
                }
            }

            this.cells = savegame.cells;
            load_error = false;

            // restore clues
            this.clues_top = new CluesGroup(this, savegame.top_clues);
            this.clues_bottom = new CluesGroup(this, savegame.bottom_clues);

            if (load_error) {
                this.error(ERR_LOAD);
                return;
            }

            if (this.clues_top) {
                this.renderClues(this.clues_top, this.clues_top_container);
            }
            if (this.clues_bottom) {
                this.renderClues(this.clues_bottom, this.clues_bottom_container);
            }

            this.active_clues = null;
            this.inactive_clues = null;
            this.changeActiveClues();

            active_word = this.active_clues.getFirstWord();
            this.setActiveWord(active_word);
            this.setActiveCell(active_word.getFirstCell());

            this.renderCells();
            alert(MSG_LOADED);
        } else {
            alert(ERR_NO_SAVEGAME);
        }
        this.closeFile();
        e.preventDefault();
        e.stopPropagation();
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
