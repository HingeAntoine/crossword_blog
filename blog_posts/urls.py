from django.urls import path
from django.shortcuts import redirect
from . import views

urlpatterns = [
    # GET TO GRID ARCHIVES
    path("", lambda request: redirect("archives/", permanent=False)),
    path("archives/", views.display_blog_archives, name="blog_archives"),
    # GRID AND ASSOCIATED OBJECTS (COMMENTS & RANKING)
    path("<str:url_blog>/", views.display_blog_post, name="blog_post"),
]
