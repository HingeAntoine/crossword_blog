from django.db import models
from enum import IntEnum


class CrosswordsType(IntEnum):
    CLASSIC = 0
    CRYPTIC = 1


class CrosswordsSize(IntEnum):
    MINI = 0
    MIDI = 1
    NORMAL = 2
    BIG = 3


# Create your models here.
class Project(models.Model):
    title = models.CharField(max_length=100)
    grid_file = models.FileField(upload_to="puzzles/")
    author = models.CharField(max_length=25)
    date_created = models.DateField(auto_now_add=True)
    solve_count = models.IntegerField(default=0)
    crossword_type = models.IntegerField(
        default=0,
        choices=[
            (CrosswordsType.CLASSIC.value, "Classique"),
            (CrosswordsType.CRYPTIC.value, "Cryptique"),
        ],
    )
    grid_size = models.IntegerField(
        default=0,
        choices=[
            (CrosswordsSize.MINI.value, "Petite"),
            (CrosswordsSize.MIDI.value, "Moyenne"),
            (CrosswordsSize.NORMAL.value, "Grande"),
            (CrosswordsSize.BIG.value, "Très grande"),
        ],
    )


class Edito(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date_created = models.DateField(auto_now_add=True)
