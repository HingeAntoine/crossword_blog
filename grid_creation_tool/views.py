from django.shortcuts import render


def construction(request):
    return render(request, "mini_tuto.html", {})


def construction_tool(request):
    return render(request, "construction_tool.html", {})
