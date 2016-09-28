from django.conf.urls import url
from django.contrib import admin

from . import views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^$',views.map,name='map'),
    url(r'^legend$',views.legend,name="legend"),
    url(r'^json/(?P<name>[a-zA-Z0-9\_]+)/$',views.json_file, name='json_file'),
]
