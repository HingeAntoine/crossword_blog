from django.conf import settings

from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import Edito

from PIL import Image, ImageDraw
import puz


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

        # Create constant grid preview
        if "grid_file" in form.changed_data:
            # Read puzzle
            p = puz.read(settings.MEDIA_ROOT + "/" + str(obj.grid_file))

            # Init image with the right size
            img = Image.new("RGB", (5 * p.width, 5 * p.height), color="white")

            # Draw on image
            d = ImageDraw.Draw(img)
            d.rectangle([0, 0, 5, 5], fill="black")

            # Save image
            img_path = f"/preview/{obj.pk}.png"
            img.save(settings.MEDIA_ROOT + img_path)


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


admin.site.register(Project, ProjectAdmin)
admin.site.register(Edito, EditoAdmin)
