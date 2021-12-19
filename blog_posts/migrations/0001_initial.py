# Generated by Django 3.1.2 on 2021-12-19 13:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [("author_page", "0003_author_twitter_handle")]

    operations = [
        migrations.CreateModel(
            name="BlogPost",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("url", models.CharField(max_length=30)),
                ("title", models.CharField(max_length=500)),
                ("post_content", models.TextField()),
                ("date_created", models.DateField(auto_now_add=True)),
                (
                    "post_author",
                    models.ForeignKey(
                        default="antoine",
                        on_delete=django.db.models.deletion.RESTRICT,
                        to="author_page.author",
                    ),
                ),
            ],
        )
    ]
