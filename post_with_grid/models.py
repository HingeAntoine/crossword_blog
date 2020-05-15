from django.db import models


# Create your models here.
class Project(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    grid_path = models.CharField(max_length=100)
    author = models.CharField(max_length=25)
    date_created = models.DateField(auto_now_add=True)
