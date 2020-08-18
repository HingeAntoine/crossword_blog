from django.db.models import F
from django.shortcuts import render
from post_with_grid.models import Project
from post_with_grid.models import Edito


def project_index(request):
    projects = Project.objects.all().order_by("-date_created", "-title")
    edito = Edito.objects.first()
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
    context = {"projects": projects}

    return render(request, "grid_archives.html", context)
