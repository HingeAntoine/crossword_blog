# Generated by Django 3.0.6 on 2020-08-18 19:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('post_with_grid', '0010_remove_project_description'),
    ]

    operations = [
        migrations.CreateModel(
            name='Edito',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('content', models.TextField()),
                ('date_created', models.DateField(auto_now_add=True)),
            ],
        ),
    ]
