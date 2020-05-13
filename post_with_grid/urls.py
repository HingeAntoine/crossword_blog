from django.urls import path
from . import views


urlpatterns = [
    path("", views.project_index, name="grid_index"),
    path("<int:pk>/", views.project_detail, name="grid_detail"),
]
