// Word constructor
var Word = function(crossword, data) {
    this.id = '';
    this.cell_ranges = [];
    this.cells = [];
    this.clue = {};
    this.crossword = crossword;
    if (data) {
        if (data.hasOwnProperty('id') && data.hasOwnProperty('cell_ranges') && data.hasOwnProperty('clue')) {
            this.id = data.id;
            this.cell_ranges = data.cell_ranges;
            this.clue = data.clue;
            this.parseRanges();
        } else {
            load_error = true;
        }
    }
};

// parses XML
Word.prototype.fromJPZ = function(xml_data) {
    if (xml_data) {
        var i, cell,
            id = xml_data.getAttribute('id'),
            x = xml_data.getAttribute('x'),
            y = xml_data.getAttribute('y');

        this.id = id;

        if (x && y) {
            this.cell_ranges.push({x: x, y: y});
        } else {
            var word_cells = xml_data.getElementsByTagName('cells');
            for (i = 0; cell = word_cells[i]; i++) {
                x = cell.getAttribute('x');
                y = cell.getAttribute('y');
                this.cell_ranges.push({x: x, y: y});
            }
        }
        this.parseRanges();
    }
};

// Parses cell ranges and stores cells coordinates as array ['x1-y1', 'x1-y2' ...]
Word.prototype.parseRanges = function() {
    var i, k,cell_range;
    this.cells = [];
    for (i = 0; cell_range = this.cell_ranges[i]; i++) {
        var split_x = cell_range.x.split('-'),
            split_y = cell_range.y.split('-'),
            x, y,
            x_from, x_to, y_from, y_to;

        if (split_x.length > 1) {
            x_from = Number(split_x[0]);
            x_to = Number(split_x[1]);
            y = split_y[0];
            for (k = x_from;(x_from<x_to?k<=x_to:k>=x_to);(x_from<x_to?k++:k--)) {
                this.cells.push(k+'-'+y);
            }
        } else if (split_y.length > 1) {
            x = split_x[0];
            y_from = Number(split_y[0]);
            y_to = Number(split_y[1]);
            for (k = y_from;(y_from<y_to?k<=y_to:k>=y_to);(y_from<y_to?k++:k--)) {
                this.cells.push(x+'-'+k);
            }
        } else {
            x = split_x[0];
            y = split_y[0];
            this.cells.push(x+'-'+y);
        }
    }
};

Word.prototype.hasCell = function(x, y) {
    return this.cells.indexOf(x+'-'+y) >= 0;
};

// get first empty cell in word
// if x and y given - get first empty cell after cell with coordinates x,y
// if there's no empty cell after those coordinates - search from begin
Word.prototype.getFirstEmptyCell = function(x, y) {
    var i, cell, coordinates, start = 0;
    if (x && y) {
        start = Math.max(0, this.cells.indexOf(x+'-'+y));
        // if currently last cell - search from beginning
        if (start == this.cells.length-1) {
            start = 0;
        }
    }
    for (i = start; coordinates = this.cells[i]; i++) {
        cell = this.getCellByCoordinates(coordinates);
        if (cell && !cell.letter) {
            return cell;
        }
    }

    // if coordinates given and no cell found - search from beginning
    if (start > 0) {
        for (i = 0; i < start; i++) {
            cell = this.getCellByCoordinates(this.cells[i]);
            if (cell && !cell.letter) {
                return cell;
            }
        }
    }

    return null;
};

Word.prototype.getFirstCell = function() {
    var cell = null;
    if (this.cells.length) {
        cell = this.getCellByCoordinates(this.cells[0]);
    }
    return cell;
};

Word.prototype.getLastCell = function() {
    var cell = null;
    if (this.cells.length) {
        cell = this.getCellByCoordinates(this.cells[this.cells.length-1]);
    }
    return cell;
};

Word.prototype.getNextCell = function(x, y) {
    var index = this.cells.indexOf(x+'-'+y),
        cell = null;
    if (index < this.cells.length-1) {
        cell = this.getCellByCoordinates(this.cells[index+1]);
    }
    return cell;
};

Word.prototype.getPreviousCell = function(x, y) {
    var index = this.cells.indexOf(x+'-'+y),
        cell = null;
    if (index > 0) {
        cell = this.getCellByCoordinates(this.cells[index-1]);
    }
    return cell;
};

Word.prototype.getCellByCoordinates = function(txt_coordinates) {
    var split, x, y, cell;
    split = txt_coordinates.split('-');
    if (split.length === 2) {
        x = split[0];
        y = split[1];
        cell = this.crossword.getCell(x, y);
        if (cell) {
            return cell;
        }
    }
    return null;
};

Word.prototype.solve = function() {
    var i, coordinates, cell;
    for (i=0; coordinates = this.cells[i]; i++) {
        cell = this.getCellByCoordinates(coordinates);
        if (cell) {
            cell.letter = cell.solution;
        }
    }
};
