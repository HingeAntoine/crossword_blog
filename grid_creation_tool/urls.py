from django.urls import path
from . import views

urlpatterns = [path("outil/", views.construction_tool, name="construction_tool")]
