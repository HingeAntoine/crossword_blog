from django.shortcuts import render
from post_with_grid.models import Project


def project_index(request):
    projects = Project.objects.all()
    context = {
        'projects': projects
    }

    return render(request, 'grid_index.html', context)


def project_detail(request, pk):
    project = Project.objects.get(pk=pk)
    context = {
        'project': project
    }

    return render(request, 'grid_detail.html', context)


def project_archives(request):
    projects = Project.objects.all()
    context = {
        'projects': projects
    }

    return render(request, 'grid_archives.html', context)
