from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import Edito


# Register your models here.
class ProjectAdmin(admin.ModelAdmin):
    fields = ("title", "description", "grid_file", "author")


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


admin.site.register(Project, ProjectAdmin)
admin.site.register(Edito, EditoAdmin)
