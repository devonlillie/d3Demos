var app = angular.module('d3App',[]);


app.controller('d3PlotController',['$scope','$http',function($scope,$http){
	window.S = $scope;
	var windowHeight = window.innerHeight;
	var windowWidth = window.innerWidth;
	function updateWindow(){
		windowHeight = document.body.clientHeight;
		windowWidth = document.body.clientWidth;
		$scope.svg.attr("width", document.body.clientWidth).attr("height", document.body.clientHeight-50);
	}
	
	window.onresize = updateWindow;
	
	$scope.height = windowHeight;
	$scope.width = windowWidth;
	
	$scope.zoom = d3.zoom()
	$scope.navbar = d3.select('#navbar')
		.append('svg')
		.attr('id','navbar')
		.attr('height',50)
		.attr('width','100%')
		.attr('x',0).attr('y',0);

	$scope.svg = d3.select('#d3canvas')
		.append("svg")
		.attr('height','100%')
		.attr('width','100%')
		.attr('id','graph')
		.attr('class','nopadding')
		.call($scope.zoom.on("zoom", function () {
			 $scope.svg.attr("transform", d3.event.transform);}))
		.on("dblclick.zoom", null)
		.append('g');
               	       	 
	$scope.reset = function(){
		d3.select('#graph').remove();
		$scope.zoom = d3.zoom()
		$scope.svg = d3.select('#d3canvas')
			.append("svg")
			.attr('id','graph')
			.attr('class','nopadding')
			.attr('height','100%')
			.attr('width','100%')
			.call($scope.zoom.on("zoom", function () {
				 $scope.svg.attr("transform", d3.event.transform);}))
			.on("dblclick.zoom", null)
			.append('g');
	
		$http.get('/json/Teims/').then(function successCallback(response){
			$scope.graph = response.data;
			$scope.graph.x0=0;
			$scope.graph.y0=0;
			$scope.nodes = defineTree($scope.graph,400,10);
			$scope.selected = $scope.nodes.data;
			$scope.buildStaticTree($scope.nodes);
		}, function errorCallback(response){
			alert('Bad data call');
		});
		
		$scope.isTree=true;
		$scope.isFocused=false;
	}
	
	///****************************************///
	///***** Graph Building functions *********///
	///****************************************///
	var buttonDefs = [{'text':'Collapse All','click':collapseAll,'class':'navs'},
		{'text':'Show All','click':showAll},
		{'text':'Reset','click':$scope.reset}]

	$scope.buttons,$scope.buttonsText = makeButtons(buttonDefs,$scope.navbar,'nav','rect',[100,30],20);
	
	$scope.svg = d3.select('#graph');
	
	$scope.tree = d3.tree().size([$scope.height,$scope.width]);
    $scope.stratify = d3.stratify().parentId(function(d) { return d.parent; });
	
	$scope.reset();
	
	$scope.update = function(node){		
		$scope.nodes = defineTree(node,400,10);
		$scope.clearElements();
		$scope.buildStaticTree($scope.nodes);
	}

	///****************************************///
	///*               Build graph            *///
	///****************************************///
	$scope.buildStaticTree = function(tree){
		$scope.link = makeLinks(tree,$scope.svg);
		$scope.node = makeNodes(tree,$scope.svg)
						.on('dblclick',collapse);		
		//Text must be defined last so that its on top of all elements
		$scope.text = makeTexts(tree,$scope.svg)
					.attr('transform',shiftText)
					.on('dblclick',function(d){console.log(d);});
					
		var templates = function(d){return d.data.type=='template';}
		$scope.childrenText = makeChildrenTexts(tree,$scope.svg,templates);
	}
	
	$scope.clearElements = function(){
			$scope.node.remove();
			$scope.link.remove();
			$scope.text.remove();
			$scope.childrenText.remove();
	}
	
	function defineTree(node,levelWidth,nodeHeight){
		var hierarchy = d3.hierarchy(node,function(d){return d.children;});	
		$scope.height = maxLevel(hierarchy,height=nodeHeight);
		var tree = d3.tree().size([$scope.height,hierarchy.height*levelWidth]);
		return tree(hierarchy);
	}
	///****************************************///
	///***** EVENT HANDLING FUNCTIONS *********///
	///****************************************///
		
	// Collapse or expand children of node
	// Note: Does not change any of the children, 
	// 	 internal structure is maintained
	function collapse(d) {
		if (d.children) {
			d.data._children = d.data.children;
			d.data.children = [];
			$scope.update($scope.graph);
		}
		else if(d.data._children){
			d.data.children = d.data._children;
			d.data._children = [];
			$scope.update($scope.graph);
		}
	}
	
	// Focus on a given node.
	// Currently not developed
	function focus(d) {
	}
	
	// Recursively hide all children in the entire graph.
	function collapseAll(){
		$scope.graph = viewChildren($scope.graph,mode='hide');		
		$scope.update($scope.graph);
	}
	
	// Recursively reveal all children in the entire graph.
	function showAll(){
		$scope.graph = viewChildren($scope.graph,mode='show');
		$scope.update($scope.graph);
	}
	function reset(){

	}
	//Create a link in the bound data between two nodes acessed by given ids
	$scope.makeLink = function(par,chi){
		var d = d3.select('circle[id="'+chi+'"]').data()[0];
		if (d!=null){
			d.parent = d3.select('circle[id="'+par+'"]').data()[0];
			if (d.parent!=null){return d;}
		}
		return;
	}
}]);

// Determine if node is an internal node, a cluster or a leaf
function classify(d) {
	if(d.children){return 'internal';} 
	else if(d.data._children.length>0 & d.data.children.length==0){return 'cluster';} 
    else {return 'leaf';}
}

// Based on position in the tree, shift text for cleaner viewing
function shiftText(d){
	switch(classify(d)){
		case 'leaf': return 'translate('+(Number(d.y)+10)+','+(Number(d.x)+5)+')';
		case 'cluster': return 'translate('+(Number(d.y)+10)+','+(Number(d.x)+5)+')';
		case 'internal': return 'translate('+(Number(d.y)+10)+','+(Number(d.x)+5)+')';
		default: return 'translate('+d.y+','+d.x+')';}
}

function classifyLink(d) {
	c =''
	if(d.target.data.internal==false) {c=c+' external';}
	else {c=c+' internal';}
	return c;
}


	
