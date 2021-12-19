from django.shortcuts import render
from .models import BlogPost


def display_blog_post(request, url_blog):
    blog_post = BlogPost.objects.filter(url=url_blog)
    return render(request, "blog_post_template.html", {})
