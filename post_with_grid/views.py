from django.db.models import F
from django.shortcuts import render
from post_with_grid.models import Project
from post_with_grid.models import Edito
from .filters import GridFilter
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

PAGINATOR_ARCHIVE_SIZE = 15


def project_index(request):
    projects = Project.objects.all().order_by("-date_created", "-title")[:6]
    edito = Edito.objects.last()
    context = {"projects": projects, "edito": edito}

    return render(request, "grid_index.html", context)


def project_detail(request, pk):
    project = Project.objects.get(pk=pk)
    context = {"project": project}

    if request.method == "POST":
        Project.objects.filter(pk=pk).update(solve_count=F("solve_count") + 1)

    return render(request, "grid_detail.html", context)


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
