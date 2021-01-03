from django.urls import path
from . import views

urlpatterns = [path("<str:name>/", views.author_page, name="author_page")]
