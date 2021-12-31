from django.contrib import admin
from .models import BlogPost, QuillPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    pass
    # fields = ("url", "title", "post_content", "post_author")


@admin.register(QuillPost)
class QuillPostAdmin(admin.ModelAdmin):
    pass
