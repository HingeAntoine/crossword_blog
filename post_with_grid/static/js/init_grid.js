function load_grid(pk, file_url){
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
}

function display_form_error(data, field, feedback, error_field){
    // Reset error form
    field.removeClass("is-invalid");
    feedback.text("");

    // Display errors in the corresponding fields
    if (error_field in data.responseJSON){
        feedback.text(data.responseJSON[error_field]);
        field.addClass("is-invalid");
    }
}

function comment_form_submit(){
    var commentForm = $('#commentForm');
    commentForm.submit(function () {
        $.ajax({
            type: 'POST',
            url: 'comments/',
            data: {
                'name': $("#inputPseudoComment").val(),
                'text': $("#inputComment").val(),
            },
            success: function(data) {
                // Reload comments
                $('#commentDiv').html('').load("comments/")
            },
            error: function (data) {
                // Display error in name field
                display_form_error(data, $("#inputPseudoComment"), $("#commentPseudoFeedback"), 'error_name')

                // Display error in text field
                display_form_error(data, $("#inputComment"), $("#commentTextFeedback"), 'error_text')
            }
        });
        return false;
    });
}

function init_grid(pk, file_url){
    // Load grid
    load_grid(pk, file_url);

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

                // Reload scores
                $('#ranking-content').html('').load(data.url);

                // Toggle score modals
                $('#submitModal').modal('hide');
                $('#best-scores-modal').modal('show');
            },
            error: function (data) {
                $('#pseudo-feedback').text(data.responseJSON.error);
                $("#inputPseudo").addClass("is-invalid");
            }
        });
        return false;
    });

    // Listen to comment form
    comment_form_submit()

}

function init_meta(pk, file_url){
    // Load grid
    load_grid(pk, file_url);

    // Listen to submit-form
    var frm = $('#submit-form');
    frm.submit(function () {
        $.ajax({
            type: 'POST',
            url: '',
            data: {
                'score': 0,
                'name': $('#inputPseudo').val(),
                'answer': $('#inputAnswer').val(),
            },
            success: function (data) {
                // Change state of can_submit_score
                grid.grid_is_finished = true
                grid.can_submit_score = false
                grid.savePuzzle()

                // Disable post button
                $('#open-modal-button').prop('disabled', 'disabled');

                // Reload scores
                $('#ranking-content').html('').load(data.url);

                // Toggle score modals
                $('#answerModal').modal('hide');
                $('#best-scores-modal').modal('show');
            },
            error: function (data) {
                // Reset error form
                $("#inputPseudo").removeClass("is-invalid");
                $('#pseudo-feedback').text("");
                $("#inputAnswer").removeClass("is-invalid");
                $('#answerFeedback').text("");

                // Display errors in the corresponding fields
                if ('error' in data.responseJSON){
                    $('#pseudo-feedback').text(data.responseJSON.error);
                    $("#inputPseudo").addClass("is-invalid");
                }

                if ('error_answer' in data.responseJSON){
                    $('#answerFeedback').text(data.responseJSON.error_answer);
                    $("#inputAnswer").addClass("is-invalid");
                }

            }
        });
        return false;
    });

    // Listen to comment form
    comment_form_submit()

}
