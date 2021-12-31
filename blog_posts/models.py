from django.db import models
from post_with_grid.models import Author
from django_quill.fields import QuillField


class BlogPost(models.Model):
    url = models.CharField(max_length=30, primary_key=True)
    title = models.CharField(max_length=500)
    post_content = QuillField()
    post_author = models.ForeignKey(
        Author, default="antoine", on_delete=models.RESTRICT
    )
    date_created = models.DateField(auto_now_add=True)


class QuillPost(models.Model):
    content = QuillField()
