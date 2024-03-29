import datetime
from django.db.models import F
from django.shortcuts import render, redirect
from post_with_grid.models import Project
from post_with_grid.models import MetaGrid
from post_with_grid.models import Score
from post_with_grid.models import Comment
from .models import CrosswordsType
from .filters import GridFilter
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse

from django.db.models.expressions import Window
from django.db.models.functions import Rank
import yaml

PAGINATOR_ARCHIVE_SIZE = 15


def get_scores(pk):
    project = Project.objects.get_subclass(pk=pk)
    scores = Score.objects.filter(grid=pk)

    # If the grid is a meta: display another page arrangement
    if isinstance(project, MetaGrid):
        # Scores are on a first come first serve basis
        scores = scores.annotate(
            rank=Window(expression=Rank(), order_by=[F("solved_at")])
        ).order_by("solved_at", "pseudo")
    elif project.crossword_type == CrosswordsType.SCRABEILLE.value:
        # Scores are ordered by best time
        scores = scores.annotate(
            rank=Window(expression=Rank(), order_by=[F("score").desc()])
        ).order_by("-score")
    else:
        # Scores are ordered by best time
        scores = scores.annotate(
            rank=Window(expression=Rank(), order_by=[F("time")])
        ).order_by("time", "solved_at", "pseudo")
    return scores


def get_graph_data(pk, name):
    # Retrieve scores
    project = Project.objects.get_subclass(pk=pk)
    scores = Score.objects.filter(grid=pk)

    # Get data depending on grid type
    if isinstance(project, MetaGrid):
        data = None
    elif project.crossword_type == CrosswordsType.SCRABEILLE.value:
        data = None
    else:
        # Bins config
        TIME_BINS = [time * 60 for time in [5, 10, 20, 30, 45, 60]]
        BINS_LABELS = ["0-5", "5-10", "10-20", "20-30", "30-45", "45-60", "60+"]
        times = [score.time for score in scores]

        # Compute bins
        bins = [0 for _ in BINS_LABELS]
        for time in times:
            for i in range(len(TIME_BINS)):
                if time < TIME_BINS[i]:
                    bins[i] += 1
                    break

        bins[-1] += len(times) - sum(bins)

        # Compute colors
        DEFAULT_COLOR = "rgba(255, 159, 64, 0.8)"
        SELECTED_COLOR = "rgba(255, 99, 132, 0.8)"

        background_colors = [DEFAULT_COLOR for _ in BINS_LABELS]

        if (len(name) > 0) & (len(scores.filter(pseudo=name)) > 0):
            score = scores.filter(pseudo=name)[0].time
        else:
            score = None

        if score is not None:
            color_index = None
            for i in range(len(TIME_BINS)):
                if score < TIME_BINS[i]:
                    color_index = i
                    break

            if color_index is None:
                color_index = -1

            background_colors[color_index] = SELECTED_COLOR

        # Format output
        data = {
            "bins_labels": BINS_LABELS,
            "bins_data": bins,
            "bins_colors": background_colors,
        }
    return data


def get_type(pk):
    project = Project.objects.get_subclass(pk=pk)

    if isinstance(project, MetaGrid):
        return "meta"
    elif project.crossword_type == CrosswordsType.SCRABEILLE.value:
        return "scrabeille"
    else:
        return "classique"


##################
# Project Detail #
##################


def scrabeille_detail(request, project, comments, pk):
    if request.method == "POST":
        if "name" in request.POST:
            # GET REQUEST VARIABLE
            name = request.POST["name"]
            score = request.POST["score"]
            private_leaderboard = request.POST["private_leaderboard"]

            # GET SCORES ASSOCIATED TO NAME, IF EXISTS
            scores_per_pseudo = Score.objects.filter(grid=pk, pseudo=name)

            # CHECKING ACCEPTANCE CRITERIA
            # RETURNING ERROR IF
            # NICK IS TOO SHORT OR TOO LONG
            # SCORE IS ALREADY THERE AND GREATER THAN EXISTING
            error_dict = {}
            if len(name) < 3:
                error_dict["error"] = "Le pseudo doit contenir au moins 3 caractères."

            if len(name) > 25:
                error_dict["error"] = "Le pseudo doit contenir au max. 25 caractères."

            if len(scores_per_pseudo) > 0:
                if int(score) <= scores_per_pseudo[0].score:
                    error_dict[
                        "error"
                    ] = "Le score associé à ce pseudo est plus petit que celui déjà sauvegardé."

            if len(error_dict) > 0:
                return JsonResponse(error_dict, status=403)

            # IF ALL IS OK, SAVE SCORE
            if len(scores_per_pseudo) == 0:
                Score(
                    grid=pk,
                    pseudo=name,
                    time=0,
                    score=score,
                    private_leaderboard=private_leaderboard,
                ).save()
            else:
                score_to_update = Score.objects.filter(grid=pk, pseudo=name)[0]
                score_to_update.score = score
                if len(private_leaderboard) > 0:
                    score_to_update.private_leaderboard = private_leaderboard
                score_to_update.save()

        return JsonResponse({"url": "/pantheon/" + str(pk) + "/?name=" + name})

    with open(project.grid_file.path, "r") as stream:
        puzzle = yaml.safe_load(stream)

    return render(
        request,
        "scrabeille_jeu.html",
        {
            "project": project,
            "comments": comments,
            "type": "scrabeille",
            "puzzle": puzzle,
        },
    )


def project_detail(request, pk):
    # Check that grid exists before continuing
    if not Project.objects.filter(pk=pk).exists():
        return redirect("homepage")

    # Get grid
    project = Project.objects.get_subclass(pk=pk)

    # IF PUBLICATION DATE IS IN THE FUTURE, RETURN TO HOMEPAGE
    if project.date_created > datetime.date.today():
        return redirect("homepage")

    comments = Comment.objects.filter(grid_key=pk).order_by("commented_at")

    if project.crossword_type == CrosswordsType.SCRABEILLE.value:
        return scrabeille_detail(request, project, comments, pk)

    if request.method == "POST":
        # Increment grid solve counter
        if "increment" in request.POST:
            Project.objects.filter(pk=pk).update(solve_count=F("solve_count") + 1)
        else:
            # Create form error dict
            error_dict = {}

            if "answer" in request.POST:
                # Read input variables
                answer = request.POST["answer"]

                # Check answer is not empty
                if len(answer) == 0:
                    error_dict["error_answer"] = "Champ obligatoire."

                # Check if answer is correct
                norm_answer = "".join(answer.split()).lower()
                if norm_answer not in project.meta_answers:
                    error_dict["error_answer"] = "Ce n'est pas la bonne réponse."

            name = ""
            if "name" in request.POST:
                name = request.POST["name"]

                if len(name) < 3:
                    error_dict[
                        "error"
                    ] = "Le pseudo doit contenir au moins 3 caractères."

                if len(name) > 25:
                    error_dict[
                        "error"
                    ] = "Le pseudo doit contenir au max. 25 caractères."

                if len(Score.objects.filter(grid=pk, pseudo=name)) > 0:
                    error_dict[
                        "error"
                    ] = "Ce pseudo correspond déjà à un score pour la grille."

            if len(error_dict) > 0:
                return JsonResponse(error_dict, status=403)

            # INITIALIZE PRIVATE LEADERBOARD CORRECTLY
            private_leaderboard = ""
            if "private_leaderboard" in request.POST:
                private_leaderboard = request.POST["private_leaderboard"]

            # Save the score
            Score(
                grid=pk,
                pseudo=name,
                time=int(request.POST["score"]),
                private_leaderboard=private_leaderboard,
                score=0,
            ).save()

            if isinstance(project, MetaGrid):
                Project.objects.filter(pk=pk).update(solve_count=F("solve_count") + 1)

            # Return an ajax call response
            return JsonResponse({"url": "/pantheon/" + str(pk) + "/?name=" + name})

    # If the grid is a meta: display another page arrangement
    if isinstance(project, MetaGrid):
        return render(
            request,
            "meta_detail.html",
            {"project": project, "comments": comments, "type": "meta"},
        )
    else:
        return render(
            request,
            "grid_detail.html",
            {"project": project, "comments": comments, "type": "classique"},
        )


####################
# Project Archives #
####################


def generate_pagination_urls(request, response, paginator):
    query_dict = request.GET.copy()

    if response.has_previous():
        query_dict["page"] = "1"
        url_first = query_dict.urlencode()

        query_dict["page"] = str(response.previous_page_number())
        url_previous = query_dict.urlencode()
    else:
        url_first = ""
        url_previous = ""

    if response.has_next():
        query_dict["page"] = str(response.next_page_number())
        url_next = query_dict.urlencode()

        query_dict["page"] = str(paginator.num_pages)
        url_last = query_dict.urlencode()
    else:
        url_next = ""
        url_last = ""

    return url_first, url_previous, url_next, url_last


def project_archives(request):

    #####################################
    # Get grids, filtered and paginated #
    #####################################

    projects = Project.objects.filter(date_created__lte=datetime.date.today()).order_by(
        "-date_created", "-title"
    )
    grid_filter = GridFilter(request.GET, queryset=projects)
    paginator = Paginator(grid_filter.qs, PAGINATOR_ARCHIVE_SIZE)

    page = request.GET.get("page")
    try:
        response = paginator.page(page)
    except PageNotAnInteger:
        response = paginator.page(1)
    except EmptyPage:
        response = paginator.page(paginator.num_pages)

    #################
    # Get page urls #
    #################

    url_first, url_previous, url_next, url_last = generate_pagination_urls(
        request, response, paginator
    )

    ######################
    # Return render dict #
    ######################

    grid_filter.form.fields["author"].label = "Autrice ou auteur"
    grid_filter.form.fields["crossword_type"].label = "Type de grille"
    grid_filter.form.fields["grid_size"].label = "Taille de grille"

    return render(
        request,
        "grid_archives.html",
        {
            "grids": response,
            "form": grid_filter.form,
            "pagnav": {
                "first": url_first,
                "previous": url_previous,
                "next": url_next,
                "last": url_last,
            },
        },
    )


############
# Comments #
############


def grid_comments(request, pk):

    # Leaving a comment on the grid
    if request.method == "POST":
        # Create form error dict
        error_dict = {}

        # Name formatting check
        if "name" in request.POST:
            name = request.POST["name"]

            if len(name) < 3:
                error_dict[
                    "error_name"
                ] = "Le pseudo doit contenir au moins 3 caractères."

            if len(name) > 25:
                error_dict[
                    "error_name"
                ] = "Le pseudo doit contenir au max. 25 caractères."
        else:
            error_dict["error_name"] = "Champ obligatoire."

        # Name formatting check
        if "text" in request.POST:
            text = request.POST["text"]

            if len(text) < 1:
                error_dict[
                    "error_text"
                ] = "Le commentaire doit contenir au min. 1 caractère."

            if len(text) > 480:
                error_dict[
                    "error_text"
                ] = "Le commentaire doit contenir au max. 480 caractères."
        else:
            error_dict["error_text"] = "Champ obligatoire."

        if len(error_dict) > 0:
            print(error_dict)
            return JsonResponse(error_dict, status=403)

        Comment(
            grid_key=pk, pseudo=request.POST["name"], comment=request.POST["text"]
        ).save()

        # Return an ajax call response
        return JsonResponse({})

    comments = Comment.objects.filter(grid_key=pk).order_by("commented_at")

    return render(request, "grid_comments.html", {"comments": comments})
