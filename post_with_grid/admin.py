from django.contrib import admin
from post_with_grid.models import Project

# Register your models here.
class ProjectAdmin(admin.ModelAdmin):
    fields = ('title', 'description', 'grid_path')

admin.site.register(Project, ProjectAdmin)
