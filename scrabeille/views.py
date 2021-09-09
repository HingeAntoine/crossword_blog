from django.shortcuts import render


def show_game(request):
    return render(request, "scrabeille_jeu.html", {})
