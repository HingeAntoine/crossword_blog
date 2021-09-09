from django.urls import path
from . import views

urlpatterns = [path("test/", views.show_game, name="project_archives")]
