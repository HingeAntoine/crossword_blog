# Generated by Django 3.1.2 on 2022-01-07 14:46

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [("blog_posts", "0002_blogpost_subtitle")]

    operations = [
        migrations.AlterField(
            model_name="blogpost",
            name="date_created",
            field=models.DateField(default=django.utils.timezone.now),
        )
    ]