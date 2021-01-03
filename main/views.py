from django.shortcuts import render

from post_with_grid.models import Project, Edito


#################
# PROJECT INDEX #
#################


def project_index(request):
    projects = Project.objects.all().order_by("-date_created", "-title")[:6]
    edito = Edito.objects.last()
    context = {"projects": projects, "edito": edito}

    return render(request, "grid_index.html", context)


#########
# ABOUT #
#########


def about(request):
    context = {}
    return render(request, "about.html", context)
