from django.contrib import admin
from .models import BlogPost, ImageBlogPost


class BlogPostAdmin(admin.ModelAdmin):
    fields = ("url", "title", "post_content", "post_author")


class ImageBlogPostAdmin(admin.ModelAdmin):
    fields = ("post", "image")


admin.site.register(BlogPost, BlogPostAdmin)
admin.site.register(ImageBlogPost, ImageBlogPostAdmin)
