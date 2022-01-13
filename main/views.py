from django.shortcuts import render

from author_page.models import Author
from blog_posts.models import BlogPost
from post_with_grid.models import Project, Score
from post_with_grid.views import get_scores, get_type

import datetime

MAX_INDEX = 6


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
            "scores": get_scores(grids[i].pk),
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


##########
# SCORES #
##########


def monthly_score_summary(request):
    # Get parameters from URL
    if "annee" in request.GET:
        year_filter = int(request.GET.get("annee"))
    else:
        year_filter = datetime.date.today().year

    if "mois" in request.GET:
        month_filter = int(request.GET.get("mois"))
    else:
        month_filter = datetime.date.today().month

    # Get all scores in September
    grid_list = Project.objects.filter(
        date_created__year__gte=year_filter,
        date_created__year__lte=year_filter,
        date_created__month__gte=month_filter,
        date_created__month__lte=month_filter,
    ).values_list("id", flat=True)

    aggregated_result = {}
    for grid in grid_list:
        scores = get_scores(grid, max_list=None)
        for score in scores:
            # Initialize dict
            if score.pseudo not in aggregated_result:
                aggregated_result[score.pseudo] = {
                    "pseudo": score.pseudo,
                    "gold": 0,
                    "silver": 0,
                    "bronze": 0,
                    "finished": 0,
                    "total": 0,
                }

            # Count once per applicable category
            if score.rank == 1:
                aggregated_result[score.pseudo]["gold"] += 1
            elif score.rank == 2:
                aggregated_result[score.pseudo]["silver"] += 1
            elif score.rank == 3:
                aggregated_result[score.pseudo]["bronze"] += 1
            else:
                aggregated_result[score.pseudo]["finished"] += 1

            # Total
            aggregated_result[score.pseudo]["total"] += 1

    # Sorted result list before displaying result
    result = sorted(
        aggregated_result.values(),
        key=lambda i: (i["gold"], i["silver"], i["bronze"], i["finished"]),
        reverse=True,
    )

    # Previous month stats url
    if month_filter == 1:
        previous_month_filter = 12
        previous_year_filter = year_filter - 1
    else:
        previous_month_filter = month_filter - 1
        previous_year_filter = year_filter
    previous_month_link = f"?annee={previous_year_filter}&mois={previous_month_filter}"

    # Previous month stats url
    if month_filter == 12:
        next_month_filter = 1
        next_year_filter = year_filter + 1
    else:
        next_month_filter = month_filter + 1
        next_year_filter = year_filter
    next_month_link = f"?annee={next_year_filter}&mois={next_month_filter}"

    # Create context
    context = {
        "date_format": datetime.date(
            year=year_filter, month=month_filter, day=1
        ).strftime("%B %Y"),
        "scores": result,
        "previous_month": previous_month_link,
        "next_month": next_month_link,
    }

    return render(request, "monthly_pantheon.html", context)


#########
# ABOUT #
#########


def about(request):
    # Get authors
    authors = Author.objects.all()

    context = {"authors": authors}
    return render(request, "about.html", context)
