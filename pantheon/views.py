from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

import datetime
import django_filters

from post_with_grid.models import Project
from post_with_grid.views import get_scores, get_type

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
        scores = get_scores(grid)
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


##################
# SCORE PER GRID #
##################

SCORE_LIST_SIZE = 15


class ScoreFilter(django_filters.FilterSet):
    private_leaderboard = django_filters.CharFilter(
        field_name="private_leaderboard", lookup_expr="iexact"
    )


def grid_scores(request, grid_key):
    #####################################
    # Get grids, filtered and paginated #
    #####################################

    scores = get_scores(grid_key)
    score_filter = ScoreFilter(request.GET, queryset=scores)
    score_filter.form.fields["private_leaderboard"].label = "Panthéon privé"

    paginator = Paginator(score_filter.qs, SCORE_LIST_SIZE)

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

    context = {
        "type": get_type(grid_key),
        "scores": response,
        "form": score_filter.form,
        "pagnav": {
            "first": url_first,
            "previous": url_previous,
            "next": url_next,
            "last": url_last,
        },
    }
    return render(request, "grid_pantheon.html", context)
