from django.db.models import F
from django.shortcuts import render
from post_with_grid.models import Project
from post_with_grid.models import MetaGrid
from post_with_grid.models import Score
from post_with_grid.models import CrosswordsSize
from .filters import GridFilter
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse

from django.db.models.expressions import Window
from django.db.models.functions import Rank

PAGINATOR_ARCHIVE_SIZE = 15


##################
# Project Detail #
##################

CROSSWORD_SIZE_REF_TIME = {
    CrosswordsSize.MINI.value: 5 * 60,
    CrosswordsSize.MIDI.value: 15 * 60,
    CrosswordsSize.NORMAL.value: 30 * 60,
    CrosswordsSize.BIG.value: 60 * 60,
}


def project_detail(request, pk):
    project = Project.objects.get_subclass(pk=pk)

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

            # Save the score
            Score(
                grid=pk,
                pseudo=request.POST["name"],
                time=int(request.POST["score"]),
                score=0,
            ).save()

            # Return an ajax call response
            return JsonResponse({"url": request.get_full_path() + "classement/"})

    # If the grid is a meta: display another page arrangement
    if isinstance(project, MetaGrid):
        # Scores are on a first come first serve basis
        scores = (
            Score.objects.filter(grid=pk)
            .annotate(rank=Window(expression=Rank(), order_by=[F("solved_at")]))
            .order_by("solved_at", "pseudo")[:5]
        )
        context = {"project": project, "scores": scores}
        return render(request, "meta_detail.html", context)
    else:
        # Scores are ordered by best time
        scores = (
            Score.objects.filter(grid=pk)
            .annotate(rank=Window(expression=Rank(), order_by=[F("time")]))
            .order_by("time", "solved_at", "pseudo")[:5]
        )
        return render(
            request, "grid_detail.html", {"project": project, "scores": scores}
        )


####################
# Project Archives #
####################


def project_archives(request):

    #####################################
    # Get grids, filtered and paginated #
    #####################################

    projects = Project.objects.all().order_by("-date_created", "-title")
    grid_filter = GridFilter(request.GET, queryset=projects)
    paginator = Paginator(grid_filter.qs, PAGINATOR_ARCHIVE_SIZE)

    page = request.GET.get("page")
    try:
        response = paginator.page(page)
    except PageNotAnInteger:
        response = paginator.page(1)
    except EmptyPage:
        response = paginator.page(paginator.num_pages)

    ####################################
    # Generate query dict with filters #
    ####################################

    query_dict = request.GET.copy()

    if response.has_previous():
        query_dict.setlist("page", "1")
        url_first = query_dict.urlencode()

        query_dict.setlist("page", str(response.previous_page_number()))
        url_previous = query_dict.urlencode()
    else:
        url_first = ""
        url_previous = ""

    if response.has_next():
        query_dict.setlist("page", str(response.next_page_number()))
        url_next = query_dict.urlencode()

        query_dict.setlist("page", str(paginator.num_pages))
        url_last = query_dict.urlencode()
    else:
        url_next = ""
        url_last = ""

    ######################
    # Return render dict #
    ######################

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


###########
# Ranking #
###########


def project_ranking(request, pk):
    scores = Score.objects.filter(grid=pk).order_by("time", "solved_at", "pseudo")
    context = {"scores": scores}

    return render(request, "grid_scores.html", context)
