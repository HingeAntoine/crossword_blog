# Generated by Django 3.0.6 on 2020-08-18 17:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0009_project_solve_count'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='description',
        ),
    ]