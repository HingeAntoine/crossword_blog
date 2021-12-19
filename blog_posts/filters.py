from .models import BlogPost
import django_filters


class BlogPostFilter(django_filters.FilterSet):
    author = django_filters.CharFilter(
        field_name="author_key__display_name", lookup_expr="iexact"
    )

    class Meta:
        model = BlogPost
        fields = []
