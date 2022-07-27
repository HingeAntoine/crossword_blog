from django.core.mail import send_mail, BadHeaderError
from django.http import HttpResponse
from django.shortcuts import render, redirect
from .forms import ContactForm
from main.settings import SERVER_EMAIL, EMAIL_HOST_USER


def contact_view(request):
    if request.method == "GET":
        form = ContactForm()
    else:
        form = ContactForm(request.POST)
        if form.is_valid():
            subject = form.cleaned_data["sujet"]
            reply_to = form.cleaned_data["email"]
            message = (
                "Emettrice-teur: "
                + reply_to
                + "\nCorps:\n"
                + form.cleaned_data["message"]
            )
            try:
                send_mail(subject, message, EMAIL_HOST_USER, [SERVER_EMAIL])
            except BadHeaderError:
                return HttpResponse("Invalid header found.")
            return redirect("success")
    return render(request, "email.html", {"form": form})


def success_view(request):
    return render(request, "success.html", {})
