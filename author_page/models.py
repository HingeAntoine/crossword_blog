from django.db import models


class Author(models.Model):
    name = models.CharField(max_length=50, primary_key=True)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(default="")
