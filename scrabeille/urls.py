from django.urls import path
from . import views

urlpatterns = [path("", views.show_game, name="project_archives")]
