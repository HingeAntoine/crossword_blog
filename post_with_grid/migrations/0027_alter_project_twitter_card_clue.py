# Generated by Django 3.2 on 2022-01-10 08:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("post_with_grid", "0026_auto_20210916_1939")]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="twitter_card_clue",
            field=models.CharField(blank=True, max_length=200),
        )
    ]