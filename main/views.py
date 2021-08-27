from django.shortcuts import render

from author_page.models import Author
from post_with_grid.models import Project, Edito
from post_with_grid.views import get_scores, get_type


#################
# PROJECT INDEX #
#################


def project_index(request):
    # Get grids and edito
    max_index = 6

    projects = Project.objects.all().order_by("-date_created", "-title")[:max_index]
    edito = Edito.objects.last()

    # Retrieve scores

    grilles_vector = [
        {
            "grille": projects[i],
            "scores": get_scores(projects[i].pk),
            "type": get_type(projects[i].pk),
        }
        for i in range(len(projects))
    ]

    # Create context
    context = {"projects": projects, "edito": edito, "scores_vector": grilles_vector}

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
