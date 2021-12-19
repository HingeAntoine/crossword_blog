from django.urls import path
from django.shortcuts import redirect
from . import views

urlpatterns = [
    # GET TO GRID ARCHIVES
    path("", lambda request: redirect("archives/", permanent=False)),
    path("archives/", views.project_archives, name="project_archives"),
    # GRID AND ASSOCIATED OBJECTS (COMMENTS & RANKING)
    path("<int:pk>/", views.project_detail, name="project_detail"),
    path("<int:pk>/classement/", views.project_ranking, name="project_ranking"),
    path("<int:pk>/comments/", views.grid_comments, name="grid_comments"),
]
