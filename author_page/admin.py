from django.contrib import admin

from author_page.models import Author


class AuthorAdmin(admin.ModelAdmin):
    def get_fields(self, request, obj=None):
        if obj is None:
            return ["name", "display_name", "bio", "twitter_handle"]
        return ["display_name", "bio", "twitter_handle"]


admin.site.register(Author, AuthorAdmin)
