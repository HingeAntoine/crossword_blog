from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from post_with_grid.models import Project
from author_page.models import Author


class GridSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Project.objects.order_by("date_created").all()

    def lastmod(self, obj):
        return obj.date_created

    def location(self, item):
        return reverse("project_detail", args=[item.pk])


class AuthorSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Author.objects.all()

    def lastmod(self, obj):
        return (
            Project.objects.filter(author_key=obj.name)
            .latest("date_created")
            .date_created
        )

    def location(self, item):
        return reverse("author_page", args=[item.name])


class StaticViewSitemap(Sitemap):
    changefreq = "weekly"
    priority = 1.0

    def items(self):
        return ["homepage", "about", "contact", "project_archives", "meta_rules"]

    def location(self, item):
        return reverse(item)
