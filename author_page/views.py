import datetime

from django.shortcuts import render
from author_page.models import Author
from post_with_grid.models import Project


def author_page(request, name):
    author = Author.objects.get(name=name)
    context = {
        "author": author,
        "projects": Project.objects.filter(
            author_key=name, date_created__lte=datetime.date.today()
        ).order_by("-date_created")[:6],
    }

    return render(request, "author_page.html", context)
