from django.shortcuts import render

from author_page.models import Author
from blog_posts.models import BlogPost
from post_with_grid.models import Project, Score
from post_with_grid.views import get_scores, get_type

import datetime


#################
# PROJECT INDEX #
#################


def project_index(request):
    # Get grids and edito
    max_index = 6

    projects = Project.objects.all().order_by("-date_created", "-title")[:max_index]
    blog_post = BlogPost.objects.order_by("-date_created", "-title")[0]

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
    context = {
        "projects": projects,
        "blog_post": blog_post,
        "scores_vector": grilles_vector,
    }

    return render(request, "grid_index.html", context)


##########
# SCORES #
##########


def monthly_score_summary(request):

    # Get all scores in September
    start_date = datetime.date(year=2021, month=9, day=1)
    end_date = datetime.date(year=2021, month=9, day=30)
    grid_list = Project.objects.filter(
        date_created__gte=start_date, date_created__lte=end_date
    ).values_list("id", flat=True)
    print(grid_list)

    scores = Score.objects.filter(grid__in=grid_list)
    print(scores)

    # Create context
    context = {}

    return render(request, "monthly_pantheon.html", context)


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
