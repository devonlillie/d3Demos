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
	

	
	$scope.navbar = d3.select('#navbar')
		.append('svg')
		.attr('id','navbar')
		.attr('height',50)
		.attr('width','100%')
		.attr('x',0).attr('y',0);

	$scope.svg = d3.select('#d3canvas')
		.append("svg")
		.attr('id','graph');
	
	$scope.transform = {'x':0,'y':0,'k':1};
	
	$scope.zoom = d3.zoom()
		.on("zoom",all_zoom);
	
	$scope.reset = function(){
		d3.select('#graph').remove();
		$scope.svg = d3.select('#d3canvas')
			.append("svg")
			.attr('id','graph')
			.call($scope.zoom)
			.on("dblclick.zoom", check_click_zoom)
			.style('padding','0px')
			.style('margin','0px')
			.attr('width',windowWidth) 
			.attr('height',windowHeight)
			.append('g');		
	
		$scope.svg
			.append('rect').attr('height',windowHeight-50).attr('width',windowWidth)
			.attr('fill','none');
		
		$scope.g = $scope.svg
			.append('g')
			.attr('class','mover');
		
		$scope.objects = $scope.g.append('g')
			.attr('id','gcontainer');

		$http.get('/json/Teims/').then(function successCallback(response){
			$scope.graph = minTree(response.data,0,3);
			$scope.graph.x0=0;
			$scope.graph.y0=0;
			
			
			$scope.nodes = defineTree($scope.graph,400,10);
			$scope.selected = $scope.nodes.data;
			console.log($scope.nodes);
			$scope.buildStaticTree($scope.nodes);
			
			$scope.transform = d3.zoomIdentity;
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
		{'text':'Reload','click':$scope.reset},
		{'text':'Reset View','click':reset}]

	$scope.buttons,$scope.buttonsText = makeButtons(buttonDefs,$scope.navbar,'nav','rect',[100,30],20);
	
	$scope.tree = d3.tree().size([$scope.height,$scope.width]);
	
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
		$scope.link = makeLinks(tree,$scope.objects);
		$scope.node = makeNodes(tree,$scope.objects)
						.on('dblclick',collapse);		
		//Text must be defined last so that its on top of all elements
		$scope.text = makeTexts(tree,$scope.objects)
					.attr('transform',shiftText);
					
		var templates = function(d){return d.data.type=='template';}
		$scope.childrenText = makeChildrenTexts(tree,$scope.objects,templates);
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
		} else if(d.data.type=='dummy') {
			console.log(d3.select('#'+d.data.parent));
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
		click_zoom($scope.nodes);
	}
	
	function click_zoom(d){
		var y = windowHeight/2-60,
			childLength = (d.height-d.depth +1 )*400,
			preLength = d.depth*400,
		    z = d3.zoomIdentity;

		if((childLength+preLength +20)>windowWidth){
			var x = -preLength+100;
		}
		else {
			var x= 100;
		}
		
		var newy = (y-d.x*z.k-1)/(1+z.k),
		    newx = (x-d.y*z.k-1)/(1+z.k);
		$scope.transform = d3.zoomIdentity.translate(newx,newy);
		$scope.g.attr('transform',$scope.transform);
	}
	
	function all_zoom(){
		var src = d3.event.sourceEvent;
		var z = d3.event.transform;
		if(src.type=='wheel'){
			$scope.transform = d3.zoomIdentity.translate($scope.transform.x,$scope.transform.y).scale(z.k);
		} else {
			$scope.transform = $scope.transform.translate(src.movementX,src.movementY);
		}
		$scope.g.attr('transform',$scope.transform);
	}
	
	function check_click_zoom(){
		var e = d3.event;
		if (e.target!=null & e.target.tagName=='text'){
			click_zoom(e.target.__data__);
		}
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
    else {
	if (d.data.type=='dummy') {return 'dummy';}
	else {return 'leaf';}
	}
}

// Based on position in the tree, shift text for cleaner viewing
function shiftText(d){
	switch(classify(d)){
		case 'leaf': return 'translate('+(Number(d.y)+10)+','+(Number(d.x)+5)+')';
		case 'dummy': return 'translate('+(Number(d.y)+10)+','+(Number(d.x)+5)+')';
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


	
