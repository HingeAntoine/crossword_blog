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
var ZIPJS_CONFIG_OPTION = 'zipjs_path';
var ZIPJS_PATH = 'lib/zip';

// errors
var ERR_FILE_LOAD     = 'Error loading file';
var ERR_UNZIP         = 'Failed to unzip file';
var ERR_NOT_CROSSWORD = 'Error opening file. Probably not a crossword.';
var ERR_NO_JQUERY     = 'jQuery not found';
var ERR_NO_ZIPJS      = 'Zip js not found';
var ERR_NO_PUZJS      = 'Puz js not found';
var ERR_LOAD          = 'Error loading savegame - probably corrupted';
var ERR_NO_SAVEGAME   = 'No saved game found';

var load_error = false;

var xw_timer, xw_timer_seconds = 0;

var template = '';

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
        if (type === FILE_PUZ) {
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

// Return the first element of a string -- if it's null return null
function firstChar(str) {
    if (str == null) {return null;}
    else {return str.charAt(0);}
}
