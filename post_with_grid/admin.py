from django.conf import settings

from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import MetaGrid
from post_with_grid.models import Edito

from PIL import Image, ImageDraw
from itertools import product
import puz

CELL_SIZE = 10


class ProjectAdmin(admin.ModelAdmin):
    fields = (
        "title",
        "grid_file",
        "author_key",
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
            img = Image.new(
                "RGB", (CELL_SIZE * p.width, CELL_SIZE * p.height), color="white"
            )

            # Draw on image
            d = ImageDraw.Draw(img)
            for i, j in product(list(range(p.width)), list(range(p.height))):
                cell = p.solution[i * p.width + j]
                if cell == ".":
                    d.rectangle(
                        [
                            CELL_SIZE * j,
                            CELL_SIZE * i,
                            CELL_SIZE * (j + 1) - 1,
                            CELL_SIZE * (i + 1) - 1,
                        ],
                        fill="black",
                    )

            # Save image
            img_path = f"/preview/{obj.pk}.png"
            img.save(settings.MEDIA_ROOT + img_path)


class MetaGridAdmin(ProjectAdmin):
    fields = (
        "title",
        "grid_file",
        "author_key",
        "crossword_type",
        "grid_size",
        "twitter_card_clue",
        "meta_answers",
    )


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


admin.site.register(Project, ProjectAdmin)
admin.site.register(MetaGrid, MetaGridAdmin)
admin.site.register(Edito, EditoAdmin)
