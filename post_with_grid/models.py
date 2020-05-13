from django.db import models
from main.settings import FILE_PATH_FIELD_DIRECTORY

# Create your models here.
class Project(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    grid_path = models.FilePathField(path=FILE_PATH_FIELD_DIRECTORY, match=".*.puz")
