from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import Edito

from django.conf import settings

from PIL import Image, ImageDraw


class ProjectAdmin(admin.ModelAdmin):
    fields = (
        "title",
        "grid_file",
        "author",
        "crossword_type",
        "grid_size",
        "twitter_card_clue",
    )

    def save_model(self, request, obj, form, change):
        # Create new object
        super(ProjectAdmin, self).save_model(request, obj, form, change)

        if "grid_file" in form.changed_data:
            # Init image with the right size
            grid_width, grid_height = (7, 7)
            img = Image.new("RGB", (5 * grid_width, 5 * grid_width), color="white")

            # Draw on image
            d = ImageDraw.Draw(img)
            d.rectangle([0, 0, 5, 5], fill="black")

            # Save image
            print(obj.pk)
            print(obj.grid_file)

            img_path = f"/preview/{obj.pk}.png"
            img.save(settings.MEDIA_ROOT + img_path)


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


admin.site.register(Project, ProjectAdmin)
admin.site.register(Edito, EditoAdmin)
