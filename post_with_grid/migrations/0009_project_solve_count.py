# Generated by Django 3.0.6 on 2020-05-28 20:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0008_remove_project_grid_path'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='solve_count',
            field=models.IntegerField(default=0),
        ),
    ]