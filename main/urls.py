"""main URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.sitemaps.views import sitemap

from . import views

from main.sitemap import GridSitemap, StaticViewSitemap, AuthorSitemap

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "sitemap.xml",
        sitemap,
        {
            "sitemaps": {
                "static": StaticViewSitemap,
                "grilles": GridSitemap,
                "author": AuthorSitemap,
            }
        },
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path("", views.project_index, name="homepage"),
    path("author/", include("author_page.urls")),
    path("grilles/", include("post_with_grid.urls")),
    path("scrabeille/", include("scrabeille.urls")),
    path("about/", views.about, name="about"),
    path("meta/", views.meta, name="meta_rules"),
    path("creation/", include("grid_creation_tool.urls")),
    path("contact/", include("contact_email.urls"), name="contact"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
