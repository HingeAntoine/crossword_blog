from django.shortcuts import render
from .models import BlogPost

from markdown import markdown


def display_blog_post(request, url_blog):
    blog_post = BlogPost.objects.filter(url=url_blog)[0]

    return render(
        request,
        "blog_post_template.html",
        {
            "title": blog_post.title,
            "author": blog_post.post_author.display_name,
            "date": blog_post.date_created,
            "content": markdown(blog_post.post_content, extensions=["tables"]),
        },
    )
