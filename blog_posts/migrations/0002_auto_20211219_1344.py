# Generated by Django 3.1.2 on 2021-12-19 13:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("blog_posts", "0001_initial")]

    operations = [
        migrations.RemoveField(model_name="blogpost", name="id"),
        migrations.AlterField(
            model_name="blogpost",
            name="url",
            field=models.CharField(max_length=30, primary_key=True, serialize=False),
        ),
    ]