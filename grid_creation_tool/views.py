from django.shortcuts import render


def construction_tool(request):
    return render(request, "construction_tool.html", {})
