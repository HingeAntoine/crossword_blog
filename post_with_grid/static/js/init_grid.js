function init_grid(pk, file_url){

    //Create Grid from puz file
    var params1 = {
      hover_enabled: false,
      settings_enabled: false,
      color_selected: '#ff7171',
      color_word: '#ffaa71',
      color_hilite: '#ececec',
      savegame_name: pk,
      puzzle_file: {url: file_url, type: 'puz'}
    };
    grid = CrosswordNexus.createCrossword($('div.crossword'), params1);

    // Add onunload save call
    window.onunload = window.onbeforeunload = function(){
        grid.savePuzzle()
    }

    // Listen to submit-form
    var frm = $('#submit-form');
    frm.submit(function () {
        $.ajax({
            type: 'POST',
            url: '',
            data: {
                'score': grid.getTime(),
                'name': $('#inputPseudo').val(),
            },
            success: function (data) {
                // Change state of can_submit_score
                grid.can_submit_score = false

                // Redirect to score window
                window.location.href = data.url;
            },
            error: function (data) {
                $('#pseudo-feedback').text(data.responseJSON.error);
                $("#inputPseudo").addClass("is-invalid");
            }
        });
        return false;
    });

}
