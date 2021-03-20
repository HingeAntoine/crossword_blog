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
    scores = get_scores(projects[0].pk)
    grid_type = get_type(projects[0].pk)

    # Create context
    context = {
        "projects": projects,
        "edito": edito,
        "scores": scores,
        "type": grid_type,
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


def construction(request):
    return render(request, "mini_tuto.html", {})
