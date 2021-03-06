# Generated by Django 3.1.2 on 2021-01-03 18:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("author_page", "0002_author_bio"),
        ("post_with_grid", "0016_project_twitter_card_clue"),
    ]

    operations = [
        migrations.RemoveField(model_name="project", name="author"),
        migrations.AddField(
            model_name="project",
            name="author_key",
            field=models.ForeignKey(
                default="antoine",
                on_delete=django.db.models.deletion.RESTRICT,
                to="author_page.author",
            ),
        ),
    ]
