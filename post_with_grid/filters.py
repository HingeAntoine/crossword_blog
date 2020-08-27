from .models import Project
import django_filters


class GridFilter(django_filters.FilterSet):
    class Meta:
        model = Project
        fields = [
            "crossword_type", "grid_size"
        ]
