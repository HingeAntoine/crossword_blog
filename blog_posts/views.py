from django.shortcuts import render, redirect
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .models import BlogPost
from post_with_grid.views import generate_pagination_urls
from datetime import date

from markdown import markdown

PAGINATOR_ARCHIVE_SIZE = 20


def display_blog_post(request, url_blog):
    blog_post = BlogPost.objects.filter(url=url_blog)[0]

    if blog_post.date_created > date.today():
        return redirect("homepage")

    return render(
        request,
        "blog_post_template.html",
        {
            "title": blog_post.title,
            "subtitle": blog_post.subtitle,
            "author": blog_post.post_author.display_name,
            "date": blog_post.date_created,
            "content": markdown(blog_post.post_content, extensions=["tables"]),
        },
    )


def display_blog_archives(request):
    #####################################
    # Get grids, filtered and paginated #
    #####################################

    projects = (
        BlogPost.objects.all()
        .filter(date_created__lte=date.today())
        .order_by("-date_created", "-title")
    )
    paginator = Paginator(projects, PAGINATOR_ARCHIVE_SIZE)

    page = request.GET.get("page")
    try:
        response = paginator.page(page)
    except PageNotAnInteger:
        response = paginator.page(1)
    except EmptyPage:
        response = paginator.page(paginator.num_pages)

    #################
    # Get page urls #
    #################

    url_first, url_previous, url_next, url_last = generate_pagination_urls(
        request, response, paginator
    )

    ######################
    # Return render dict #
    ######################

    return render(
        request,
        "blog_archives.html",
        {
            "grids": response,
            "pagnav": {
                "first": url_first,
                "previous": url_previous,
                "next": url_next,
                "last": url_last,
            },
        },
    )
