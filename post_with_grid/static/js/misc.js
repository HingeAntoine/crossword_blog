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
var FILE_IPUZ = 'ipuz';
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
var MSG_SAVED = 'Grille sauvée';
var MSG_LOADED = 'Grille chargée';
var MSG_SOLVED = 'Vous avez fini la grille. Bravo!';

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
var ERR_NOT_CROSSWORD = 'Error opening file. Probably not a crossword.';
var ERR_NO_JQUERY     = 'jQuery not found';
var ERR_NO_PUZJS      = 'Puz js not found';
var ERR_LOAD          = 'Error loading savegame - probably corrupted';
var ERR_NO_SAVEGAME   = 'No saved game found';

var load_error = false;

// Timer variables
var xw_timer, xw_timer_seconds = 0;
var xw_last_save;
var xw_last_save_time = 0;
var xw_last_save_running = false;

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

function loadFromFile(file, type, deferred) {
    var reader = new FileReader();
    deferred = deferred || $.Deferred();
    reader.onload = function (event) {
        var string = event.target.result;
        deferred.resolve(string);
    };
    if (type == "ipuz"){
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
    return deferred;
}

//function loadFromFile(file, type, deferred) {
//    var reader = new FileReader();
//    deferred = deferred || $.Deferred();
//    reader.onload = function(event) {
//        var string = event.target.result;
//        if (type === FILE_PUZ) {
//            deferred.resolve(string);
//        }
//    };
//    if (type === FILE_PUZ) {
//        reader.readAsBinaryString(file);
//    } else {
//        reader.readAsText(file);
//    }
//    return deferred;
//}

// Return the first element of a string -- if it's null return null
function firstChar(str) {
    if (str == null) {return null;}
    else {return str.charAt(0);}
}

function formatDisplayTime(xw_timer_seconds) {
    display_seconds = xw_timer_seconds % 60;
    display_minutes = (xw_timer_seconds - display_seconds) / 60;

    var display = (display_minutes ? (display_minutes > 9 ? display_minutes : "0" + display_minutes) : "00") + ":" + (display_seconds > 9 ? display_seconds : "0" + display_seconds);

    return display
}

// Grid blur when pausing the grid

var PAUSE_SYMBOL = "em-double_vertical_bar"
var PLAY_SYMBOL = "em-arrow_forward"
var grid_blur = 0

function toggleHideGrid(){
    if(grid_blur == 0){
        //Change grid blur value
        grid_blur = 5;

        // Save if grid is not finished
        if(!grid.grid_is_finished) {
            grid.savePuzzle();
        }

        // Deactivate listeners on grid
        grid.deactivateCells();

        // Toggle pause symbol to play
        $("#timer-symbol").removeClass(PAUSE_SYMBOL);
        $("#timer-symbol").addClass(PLAY_SYMBOL);

    } else {
        // Change grid blur value
        grid_blur = 0;

        // If grid is not finish, add listeners back
        if(!grid.grid_is_finished) {
            grid.addListeners();
        }

        // Toggle play symbol to pause
        $("#timer-symbol").removeClass(PLAY_SYMBOL);
        $("#timer-symbol").addClass(PAUSE_SYMBOL);
    }

    // Start/stop timer
    grid.toggleTimer();

    // Change the blur value of grid space and big clue
    document.getElementById("cw-top-text").style.filter = "blur(" + grid_blur + "px)"
    document.getElementById("canvasContainer").style.filter = "blur(" + grid_blur + "px)"
}

// Toggle between plus and minus sign in button toolbar

function togglePlusSign(){
    var plusButton = $("#plusButton");
    if( plusButton.hasClass("em-heavy_plus_sign")){
        plusButton.removeClass("em-heavy_plus_sign");
        plusButton.addClass("em-heavy_minus_sign");
    } else {
        plusButton.removeClass("em-heavy_minus_sign");
        plusButton.addClass("em-heavy_plus_sign");
    }
}
