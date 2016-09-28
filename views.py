from django.shortcuts import render,get_object_or_404
from django.http import HttpResponse,HttpResponseNotFound
from django.template import loader

import os
import json

def test(request):
	template = loader.get_template('map/sitemap.html')
	context = {
		'angularPage':True,
		'pageTitle': 'Site Map',
		'jsFiles': [
			'map/js/d3Tree.js',
			'map/js/treeFunctions.js',
			'map/js/siteMap.js',
			'map/js/src/angularjs-slider-master/dist/rzslider.min.js',
			],
		'cssFiles': [
			'map/css/main.css',
			'map/css/d3Tree.css',
			'map/js/src/angularjs-slider-master/dist/rzslider.min.css',
			],
		'cssCDN': [
			
			],
		'jsCDN': [
			"https://d3js.org/d3.v4.min.js",
			]
		}
	return HttpResponse(template.render(context,request))

def legend(request):
	template = loader.get_template('map/legend.html')
	context = {
		'angularPage':False,
		'pageTitle': 'Map Legend',
		'jsFiles': [
			'map/js/vis.min.js',
			'map/js/legend.js'
			],
		'cssFiles': [
			'map/css/main.css',
			'map/css/d3Tree.css'],
		}
	return HttpResponse(template.render(context,request))
