from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from post_with_grid.models import Project


class GridSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.8

    def items(self):
        return Project.objects.all()

    def lastmod(self, obj):
        return obj.date_created

    def location(self, item):
        return reverse("project_detail", args=[item.pk])
