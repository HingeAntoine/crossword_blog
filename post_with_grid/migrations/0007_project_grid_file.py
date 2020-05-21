# Generated by Django 3.0.6 on 2020-05-21 15:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0006_project_author'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='grid_file',
            field=models.FileField(default='puzzle/test.puz', upload_to='puzzles/'),
            preserve_default=False,
        ),
    ]
