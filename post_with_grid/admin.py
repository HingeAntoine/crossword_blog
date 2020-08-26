from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import Edito


# Register your models here.
class ProjectAdmin(admin.ModelAdmin):
    fields = ("title", "grid_file", "author", "crossword_type")


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


admin.site.register(Project, ProjectAdmin)
admin.site.register(Edito, EditoAdmin)
