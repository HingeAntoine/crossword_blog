# Generated by Django 3.0.6 on 2020-05-21 15:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0007_project_grid_file'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='grid_path',
        ),
    ]
