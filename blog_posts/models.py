from django.db import models
import post_with_grid.models


class BlogPost(models.Model):
    url = models.CharField(max_length=30)
    title = models.CharField(max_length=500)
    post_content = models.TextField()
    post_author = models.ForeignKey(
        post_with_grid.models.Author, default="antoine", on_delete=models.RESTRICT
    )
    date_created = models.DateField(auto_now_add=True)