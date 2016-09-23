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

	$scope.svg = createSvg('#d3canvas')
		.call($scope.zoom.on("zoom", function () {
			 $scope.svg.attr("transform", d3.event.transform);}))
		.on("dblclick.zoom", null);
               	       	 
	$scope.reset = function(){
		d3.select('#graph').remove();
		$scope.zoom = d3.zoom()
		$scope.svg = createSvg('#d3canvas')
				.call($scope.zoom.on("zoom", function () {
					 $scope.svg.attr("transform", d3.event.transform);}))
				.on("dblclick.zoom", null);
	
		$http.get('/json/Teims/').then(function successCallback(response){
			$scope.graph = response.data;
			$scope.update($scope.graph);
		}, function errorCallback(response){
			alert('Bad data call');
		});
	}
	
	///****************************************///
	///***** Graph Building functions *********///
	///****************************************///
	var buttonDefs = [{'text':'Collapse All','click':collapseAll,'class':'navs'},
		{'text':'Show All','click':showAll},
		{'text':'Reset','click':$scope.reset}]

	$scope.buttons,$scope.buttonsText = makeButtons(buttonDefs,$scope.navbar,'nav','rect',[100,30]);
	
	$scope.svg = d3.select('#graph');

	// Initialize all element variables	
	$scope.node= $scope.svg.selectAll('.node');
	$scope.link= $scope.svg.selectAll('.link');
	$scope.text= $scope.svg.selectAll('.label');
	$scope.children= $scope.svg.selectAll('.template--children');
	$scope.depLink= $scope.svg.selectAll('.dependency');
	
	$scope.tree = d3.tree().size([$scope.height,$scope.width]);
    $scope.stratify = d3.stratify().parentId(function(d) { return d.parent; });
	
	$scope.reset();
	$scope.update = function(node){
		$scope.isTree=true;
		$scope.isFocused=false;
		
		var hierarchy = d3.hierarchy(node,function(d){return d.children;});	
		$scope.height = maxLevel(hierarchy,height=10);
		var tree = d3.tree().size([$scope.height,hierarchy.height*400]);
		$scope.nodes = tree(hierarchy);
		$scope.selected = $scope.nodes;
		
		// Clear past objects from svg
		$scope.clearElements();
		$scope.buildStaticTree($scope.nodes);
	}

	$scope.updateFocus = function(node){
		$scope.isTree=false;
		$scope.isFocused=true;
		
		var levels = d3.hierarchy(node, function(d){return d.children;});
		$scope.height = maxLevel(node,height=10);
		var focusTree = d3.tree().size([$scope.height,levels.height*300]);
		$scope.fnodes = focusTree(levels);
		$scope.clearElements();
		$scope.buildStaticTree($scope.fnodes);
	}
	
	$scope.buildStaticTree = function(tree){
		$scope.link = makeLinks(tree,$scope.svg);
		$scope.node = makeNodes(tree,$scope.svg)
						.on('dblclick',collapse);		
						
		//Aditional dependencies, won't affect structure or order of nodes
		$scope.dependencies = [];
		$scope.depLink = makeDependencyLinks($scope.dependencies,$scope.svg);		
				
		//Text must be defined last so that its on top of all elements
		$scope.text = makeTexts(tree,$scope.svg)
					.attr('transform',shiftText)
					.on('dblclick',focus);	
					
		var templates = function(d){return d.data.type=='template';}
		$scope.childrenText = makeChildrenTexts(tree,$scope.svg,templates);
	}
	
	$scope.clearElements = function(){
			$scope.node.remove();
			$scope.link.remove();
			$scope.text.remove();
			$scope.children.remove();
			$scope.depLink.remove();
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
		if($scope.isTree | $scope.selected.data.name!=d.data.name){
			$scope.selected = d;
			var open = viewChildren(d);
			$scope.focusNodes = simplify(open);
			$scope.updateFocus($scope.focusNodes);
			console.log($scope.graph);
		} else {
			$scope.selected=null;
			$scope.reset();
		}
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


	
