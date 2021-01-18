import os

from model_utils.managers import InheritanceManager
from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField
from enum import IntEnum

import time
from datetime import datetime, timedelta

from author_page.models import Author


class CrosswordsType(IntEnum):
    CLASSIC = 0
    CRYPTIC = 1
    META = 2


class CrosswordsSize(IntEnum):
    MINI = 0
    MIDI = 1
    NORMAL = 2
    BIG = 3


class Project(models.Model):
    title = models.CharField(max_length=100)
    grid_file = models.FileField(upload_to="puzzles/")
    author_key = models.ForeignKey(Author, default="antoine", on_delete=models.RESTRICT)
    date_created = models.DateField(auto_now_add=True)
    solve_count = models.IntegerField(default=0)
    crossword_type = models.IntegerField(
        default=0,
        choices=[
            (CrosswordsType.CLASSIC.value, "Classique"),
            (CrosswordsType.CRYPTIC.value, "Cryptique"),
            (CrosswordsType.META.value, "Méta"),
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

    twitter_card_clue = models.CharField(
        default="Grille de mots croisés", max_length=200
    )

    objects = InheritanceManager()

    @property
    def is_new(self):
        return datetime.today().date() - self.date_created < timedelta(weeks=1)

    @property
    def preview_path(self):
        preview_path = "preview/" + str(self.pk) + ".png"
        if os.path.isfile(settings.MEDIA_ROOT + "/" + preview_path):
            return settings.MEDIA_URL + preview_path
        return settings.STATIC_URL + "img/logo.png"


class MetaGrid(Project):
    meta_question = models.CharField(max_length=200, default="La réponse est simple!")
    meta_answers = ArrayField(models.CharField(max_length=50))


###############
# Edito Model #
###############


class Edito(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date_created = models.DateField(auto_now_add=True)


###############
# Score Model #
###############


class Score(models.Model):
    grid = models.IntegerField()
    pseudo = models.CharField(max_length=25)
    time = models.IntegerField()
    score = models.IntegerField()
    solved_at = models.DateTimeField(auto_now_add=True)

    @property
    def get_minute_secs(self):
        if self.time >= 3600:
            return time.strftime("%H:%M:%S", time.gmtime(self.time))
        return time.strftime("%M:%S", time.gmtime(self.time))

    class Meta:
        unique_together = (("grid", "pseudo"),)
