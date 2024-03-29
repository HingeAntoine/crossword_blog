from django.utils import timezone
from django.db import models
import post_with_grid.models


class BlogPost(models.Model):
    url = models.CharField(max_length=30, primary_key=True)
    title = models.CharField(max_length=500)
    subtitle = models.CharField(max_length=500)
    post_content = models.TextField()
    post_author = models.ForeignKey(
        post_with_grid.models.Author, default="antoine", on_delete=models.RESTRICT
    )
    date_created = models.DateField(default=timezone.now)


class ImageBlogPost(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.RESTRICT)
    image = models.FileField(upload_to="blog_pics/")
