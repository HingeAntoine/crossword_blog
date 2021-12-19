from django.contrib import admin
from .models import BlogPost


class BlogPostAdmin(admin.ModelAdmin):
    fields = ("url", "title", "post_content", "post_author")


admin.site.register(BlogPost, BlogPostAdmin)
