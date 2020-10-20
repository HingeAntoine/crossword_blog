from django.db import models
from enum import IntEnum

import time
from datetime import datetime, timedelta

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

    @property
    def is_new(self):
        return datetime.today().date() - self.date_created < timedelta(weeks=1)


class Edito(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date_created = models.DateField(auto_now_add=True)


class Score(models.Model):
    grid = models.IntegerField()
    pseudo = models.CharField(max_length=25)
    time = models.IntegerField()
    score = models.IntegerField()
    solved_at = models.DateTimeField(auto_now_add=True)

    @property
    def get_minute_secs(self):
        if self.time >= 3600:
            return time.strftime('%H:%M:%S', time.gmtime(self.time))
        return time.strftime('%M:%S', time.gmtime(self.time))

    class Meta:
        unique_together = (("grid", "pseudo"),)
