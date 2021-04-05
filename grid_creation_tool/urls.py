from django.urls import path
from . import views

urlpatterns = [
    path("tuto/", views.construction, name="construction_tuto"),
    path("outil/", views.construction_tool, name="contruction_tool"),
]
