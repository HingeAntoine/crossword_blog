from django.core.mail import send_mail, BadHeaderError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from .forms import ContactForm
from main.settings import SERVER_EMAIL


def contact_view(request):
    if request.method == 'GET':
        form = ContactForm()
    else:
        form = ContactForm(request.POST)
        if form.is_valid():
            subject = form.cleaned_data['sujet']
            from_email = form.cleaned_data['email']
            message = 'Emettrice-teur: ' + \
                      from_email + \
                      '\nCorps:\n' + \
                      form.cleaned_data['message']
            try:
                send_mail(subject, message, from_email, [SERVER_EMAIL])
            except BadHeaderError:
                return HttpResponse('Invalid header found.')
            return redirect('success')
    return render(request, "email.html", {'form': form})


def success_view(request):
    return render(request, "success.html", {})
