from .models import Project
import django_filters


class GridFilter(django_filters.FilterSet):
    author = django_filters.CharFilter(
        field_name="author_key__display_name", lookup_expr="iexact"
    )

    class Meta:
        model = Project
        fields = ["crossword_type", "grid_size"]
