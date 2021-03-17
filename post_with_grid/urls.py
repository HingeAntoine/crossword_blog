from django.urls import path
from . import views

urlpatterns = [
    path("archives/", views.project_archives, name="project_archives"),
    path("<int:pk>/", views.project_detail, name="project_detail"),
    path("<int:pk>/classement/", views.project_ranking, name="project_ranking"),
    path("<int:pk>/comments/", views.grid_comments, name="grid_comments"),
]
