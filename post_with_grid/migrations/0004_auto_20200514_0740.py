# Generated by Django 3.0.6 on 2020-05-14 07:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0003_auto_20200514_0736'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='grid_path',
            field=models.CharField(max_length=100),
        ),
    ]
