from django.urls import path
from . import views

urlpatterns = [
    path("<str:url_blog>/", views.display_blog_post, name="blog_post"),
    # path("tuto/", views.construction, name="construction_tuto"),
    # path("outil/", views.construction_tool, name="construction_tool"),
]
