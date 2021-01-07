from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from post_with_grid.models import Project


class GridSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Project.objects.order_by("date_created").all()

    def lastmod(self, obj):
        return obj.date_created

    def location(self, item):
        return reverse("project_detail", args=[item.pk])


class StaticViewSitemap(Sitemap):
    changefreq = "weekly"
    priority = 1.0

    def items(self):
        return ["homepage", "about", "contact", "project_archives"]

    def location(self, item):
        return reverse(item)
