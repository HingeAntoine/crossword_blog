var new_grid = 'em-new';
var start_grid = 'em-black_nib';
var finished_grid = 'em-crown';

function get_status(pk , is_new) {
        var saveName = "crossword_nexus_savegame" + pk;
        var card = $('#status-' + pk);
        if (saveName in localStorage) {
            json_grid = JSON.parse(localStorage[saveName])
            if(json_grid["is_finished"]){
                card.addClass(finished_grid);
            } else {
                card.addClass(start_grid);
            }
        } else {
            if (is_new == 'True'){
                card.addClass(new_grid);
            }
        }
}
