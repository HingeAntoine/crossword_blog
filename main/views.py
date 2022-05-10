from django.shortcuts import render

from author_page.models import Author
from blog_posts.models import BlogPost
from post_with_grid.models import Project
from post_with_grid.views import get_scores, get_type

import datetime

MAX_INDEX = 6
MAX_NUMBER_OF_SCORES = 12


#################
# PROJECT INDEX #
#################


def project_index(request):
    # Get grids and edito
    grids = Project.objects.filter(date_created__lte=datetime.date.today()).order_by(
        "-date_created", "-title"
    )[:MAX_INDEX]
    blog_posts = BlogPost.objects.filter(
        date_created__lte=datetime.date.today()
    ).order_by("-date_created", "-title")[:MAX_INDEX]

    # Retrieve scores
    grilles_vector = [
        {
            "grille": grids[i],
            "scores": get_scores(grids[i].pk)[:MAX_NUMBER_OF_SCORES],
            "type": get_type(grids[i].pk),
        }
        for i in range(len(grids))
    ]

    # Create context
    context = {
        "projects": grids,
        "blog_posts": blog_posts,
        "scores_vector": grilles_vector,
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
