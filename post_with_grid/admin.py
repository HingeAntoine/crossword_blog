from django.conf import settings

from django.contrib import admin
from post_with_grid.models import Project
from post_with_grid.models import MetaGrid
from post_with_grid.models import Edito
from post_with_grid.models import Score
from post_with_grid.models import Comment

from PIL import Image, ImageDraw
from os import path
import puz

CELL_SIZE = 10


class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author_key",
        "crossword_type",
        "grid_size",
        "solve_count",
        "download_count",
    )

    fields = (
        "title",
        "grid_file",
        "author_key",
        "crossword_type",
        "grid_size",
        "grid_information",
        "twitter_card_clue",
        "date_created",
    )

    ordering = ("-date_created",)

    def save_model(self, request, obj, form, change):
        # Create new object
        super(ProjectAdmin, self).save_model(request, obj, form, change)

        # Create constant grid preview
        if (
            "grid_file" in form.changed_data
            and path.splitext(str(obj.grid_file))[1] == ".puz"
        ):
            # Read puzzle
            p = puz.read(settings.MEDIA_ROOT + "/" + str(obj.grid_file))

            # Init image with the right size
            img = Image.new(
                "RGB", (CELL_SIZE * p.width, CELL_SIZE * p.height), color="white"
            )

            # Draw on image
            d = ImageDraw.Draw(img)
            print(p.width, p.height)
            for i in range(p.width):
                for j in range(p.height):
                    cell = p.solution[j * p.width + i]
                    if cell == ".":
                        d.rectangle(
                            [
                                CELL_SIZE * i,
                                CELL_SIZE * j,
                                CELL_SIZE * (i + 1) - 1,
                                CELL_SIZE * (j + 1) - 1,
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
        "grid_information",
        "twitter_card_clue",
        "meta_answers",
        "meta_solution_picture",
        "meta_explanation",
    )


class EditoAdmin(admin.ModelAdmin):
    fields = ("title", "content")


class ScoreAdmin(admin.ModelAdmin):
    list_display = ("grid", "pseudo", "time", "solved_at")


class CommentAdmin(admin.ModelAdmin):
    list_display = ("grid_key", "pseudo", "comment", "commented_at")


admin.site.register(Project, ProjectAdmin)
admin.site.register(MetaGrid, MetaGridAdmin)
admin.site.register(Edito, EditoAdmin)
admin.site.register(Score, ScoreAdmin)
admin.site.register(Comment, CommentAdmin)
