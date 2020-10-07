from django.db.models import F
from django.shortcuts import render
from post_with_grid.models import Project
from post_with_grid.models import Edito
from .filters import GridFilter
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

PAGINATOR_ARCHIVE_SIZE = 2


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

    return render(
        request, "grid_archives.html", {"grids": response, "form": grid_filter.form}
    )
