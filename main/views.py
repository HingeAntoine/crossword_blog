from django.shortcuts import render

from author_page.models import Author
from post_with_grid.models import Project, Edito
from post_with_grid.views import get_scores, get_type


#################
# PROJECT INDEX #
#################


def project_index(request):
    # Get grids and edito
    projects = Project.objects.all().order_by("-date_created", "-title")[:6]
    edito = Edito.objects.last()

    # Retrieve scores
    scores_vector = [
        get_scores(projects[0].pk),
        get_scores(projects[1].pk),
        get_scores(projects[2].pk),
    ]
    grid_type_vector = [
        get_type(projects[0].pk),
        get_type(projects[1].pk),
        get_type(projects[2].pk),
    ]

    # Create context
    context = {
        "projects": projects,
        "edito": edito,
        "scores_vector": scores_vector,
        "type_vector": grid_type_vector,
    }

    return render(request, "grid_index.html", context)


#########
# ABOUT #
#########


def about(request):
    # Get authors
    authors = Author.objects.all()

    context = {"authors": authors}
    return render(request, "about.html", context)


def meta(request):
    return render(request, "meta_rules.html", {})
