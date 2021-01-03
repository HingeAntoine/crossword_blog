from django.shortcuts import render
from author_page.models import Author


def author_page(request, name):
    author = Author.objects.get(name=name)
    context = {"author": author}

    return render(request, "author_page.html", context)
