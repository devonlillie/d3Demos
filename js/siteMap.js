var app = angular.module('d3App',[]);


app.controller('d3PlotController',['$scope','$http',function($scope,$http){
	window.S = $scope;
    	$scope.cwidth = document.getElementById("d3canvas").offsetWidth;
	$scope.cheight = document.getElementById("d3canvas").offsetHeight;
	$scope.height = $scope.cheight,$scope.width = $scope.cwidth;
	$scope.navButtons = [{'text':'Collapse All','click':collapseAll,'class':'navs'},
{'text':'Show All','click':showAll,'class':'navs'}]
	$scope.navbar = d3.select('#d3canvas')
		.append('svg')
		.attr('id','navbar')
		.attr('height',50)
		.attr('width','100%')
		.attr('x',0).attr('y',0);

	$scope.buttons = $scope.navbar
		.selectAll('.nav')
		.data($scope.navButtons).enter()
		.append('rect')
			.on('click',function(d){ d.click();})
			.attr('class','nav')
			.attr('transform',function(d,i){return 'translate('+(i*100)+',0)';})
			.attr('fill','#ccc').attr('height',30).attr('width',"100");

	$scope.buttonsText = $scope.navbar
		.selectAll('.navtext')
		.data($scope.navButtons).enter()
		.append('text').text('Collapse All')
			.text(function(d){return d.text;})
			.on('click',function(d){ d.click();})
			.attr('transform',function(d,i){return 'translate('+(20+i*100)+',20)';})
			.attr('class','navtext');

	
	$scope.svg = d3.select('#d3canvas')
	  	.append("svg")
		.attr('id','graph')
		.attr('class','nopadding')
  		.attr("width", "100%")
		.attr("height", "100%")
		.call(d3.zoom().on("zoom", function () {
			$scope.transform = d3.event.transform;
			$scope.svg.attr("transform", d3.event.transform)}))
		.on("dblclick.zoom", null)
		.append('g');

	// Initialize all element variables	
	$scope.node= $scope.svg.selectAll('.node');
	$scope.link= $scope.svg.selectAll('.link');
	$scope.text= $scope.svg.selectAll('.label');
	$scope.children= $scope.svg.selectAll('.template--children');
	$scope.depLink= $scope.svg.selectAll('.dependency');
	
	$scope.tree = d3.tree().size([$scope.height,$scope.width]);
    	
	$http.get('/json/SpactTestGroups/').then(function successCallback(response){
		$scope.graph = response.data;
		$scope.graph.x0 = $scope.height/2,$scope.graph.y0 = 0;
		$scope.update($scope.graph);
	}, function errorCallback(response){
		alert('Bad data call');
	});

	$scope.update = function(root){
		$scope.isTree=true;
		
		$scope.hierarchy = d3.hierarchy(root,function(d){return d.children;});	
		$scope.height = maxLevel($scope.hierarchy,height=10);
		$scope.tree = d3.tree().size([Math.max($scope.cheight,$scope.height*1.15),$scope.hierarchy.height*400]);
		$scope.nodes = $scope.tree($scope.hierarchy);
	
		// Clear past objects from svg	
		$scope.node.remove();
		$scope.link.remove();
		$scope.text.remove();
		$scope.children.remove();
		$scope.depLink.remove();
	
		// Create links(path elements) from $scope.nodes list
		// Attributes:
		//	'class': "link" + "link--external" if url is not in TEIMS 
		//	'd': curve definition of path
		// CSS:
		//	stroke, stroke-width, opacity
		$scope.link = $scope.svg.selectAll(".link")
			.data( $scope.nodes.descendants().slice(1))
			.enter().append("path")
				.attr("class","link")
				.attr("d", function(d) {
					return "M" + d.y + "," + d.x
					 + "C" + (d.y + d.parent.y) / 2 + "," + d.x
					 + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
					 + " " + d.parent.y + "," + d.parent.x;
				});
		
		// Create circle node elements from from $scope.nodes
		// Attributes:
		// 	'class': 'node' and 'node--{{type}}'
		// 	'id': node['name']
		// 	'r': Nodes have uniform radius=5
		// CSS:
		//	fill, opacity, stroke, stroke-width
		// Events:
		// 	dblclick  :  Collapse or expand children of node on double click
		//	click  :  focus on node, doesn't change structure only changes view of tree
		$scope.node = $scope.svg.selectAll('.node')
			.data($scope.nodes.descendants()).enter()
			.append('circle')
				.attr('class',function(d){return 'node node--'+classify(d);})
				.attr('r',5)
				.attr('transform',function(d){return 'translate('+d.y+','+d.x+')';})
				.attr('id',function(d){return d.data.name;})
				.on('dblclick',collapse)
				.on('click',focus);
		
		
		//Aditional dependencies, won't affect structure or order of nodes
		//just creates additional visible edges across the hierarchy
		$scope.dependencies = [];
		
		$scope.depLink = $scope.svg.selectAll(".dependency")
			.data($scope.dependencies)
			.enter().append("path")
				.attr("class", "dependency")
				.attr('fill',null)
				.attr("d", function(d) {
					return "M" + d.y + "," + d.x
					 + "C" + (d.y + d.parent.y) / 2 + "," + d.x
					 + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
					 + " " + d.parent.y + "," + d.parent.x;
				});
				
				
		//Text must be defined last so that its on top of all elements
		// Text objects created from node.label data
		// Attributes:
		//	'class': {'leaf','internal','cluster'}
		//	'text-anchor': depends on class of attached node
		//	'transform' : shifts text depending on where text-anchor is
		//	to avoid occluding node shape
		// CSS:
		//	font-family, font-size,
		$scope.text = $scope.svg.selectAll('.label')
			.data($scope.nodes.descendants()).enter()
			.append('text')
				.attr('class','name node--label')
				.attr('text-anchor','start')
				.text(function(d){return d.data.label;})
				.attr('transform',shiftText);
				
				
		// Small numeric text that tells the number of pages being hidden by a 
		// template node.
		// Attributes:
		//	'class': template template--children
		//	'text-anchor': end
		//	'transform' : shifts text depending on where text-anchor is
		//	to avoid occluding node shape
		// CSS:
		//	None
		$scope.children = $scope.svg.selectAll('.template--children')
			.data($scope.nodes.descendants().filter(function(d){return d.data.type=='template';})).enter()
			.append('text')
				.attr('class','template template--children')
				.text(function(d){if(d.data._children) return d.data._children.length;})
				.attr('fill','red')
				.attr('transform',function(d){return 'translate('+(Number(d.y)-20)+','+d.x+')';})
				.attr('text-anchor','end');

		
	}

					

				

	// Dummy function to change view to focus on data and time dependencies related 
	// to the selected tool rather than structural hierarchy of the tool within TEIMS
	$scope.dependencyView = function (d) {
		return true;
	}
	
	// Collapse or expand children of node
	// Note: Does not change any of the children, 
	// 	 internal structure is maintained
	function collapse(d) {
		if (d.children) {
			console.log(d.data.children);
			d.data._children = d.data.children;
			d.data.children = null;
			$scope.update($scope.graph);
		}
		else if(d.data._children){
			d.data.children = d.data._children;
			d.data._children = null;
			$scope.update($scope.graph);
		}
	}
	
	// Focus on a given node.
	// Currently not developed
	function focus(d) {
		$scope.selected = d;
		if ($scope.isTree) {
			$scope.dependencyView($scope.selected);
		}
	}
	
	// Given root of nested json structure, recurse through the nodes
	//to create a flat list of all nodes with dependencies still present
	//change shape of node based on attributes
	// Output:
	//	output['links']: list of link objects 
	//	output['nodes']: list of node objects
	function flatten(root){
        	var nodes =[];
        	var links = [];
	        var ind = 0;
        	function recurse(node){
                	if (node.children) node.children.forEach(recurse);
			if (node.type=='tool'){
				node['shape'] = 'rect';
			} else {
				node['shape'] = 'circle';
			}	
                	nodes.push(node);
                	if(node.parent){
                	        links.push({source:node.parent,target:node.id,index:++ind});
                	}
        	}
       		recurse(root);
        	return {nodes:nodes,links:links};
	}
	
	function collapseAll(){
		$scope.graph = viewChildren($scope.graph,mode='hide');		
		$scope.update($scope.graph);
	}	
	function showAll(){
		$scope.graph = viewChildren($scope.graph,mode='show');
		$scope.update($scope.graph);
	}

	//Create a link in the bound data between two nodes acessed by given ids
	$scope.makeLink = function(par,chi){
		var d = d3.select('circle[id="'+chi+'"]').data()[0];
		if (d!=null){
			d.parent = d3.select('circle[id="'+par+'"]').data()[0];
			if (d.parent!=null){return d;}
		}
	}
}]);

// Determine if node is an internal node, a cluster or a leaf
function classify(d) {
	if(d.children){return 'internal';} 
	else if(d.data._children){return 'cluster';} 
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

// Given 
function classifyLink(d) {
	c =''
	if(d.target.data.internal==false) {c=c+' external';}
	else {c=c+' internal';}
	
	return c;
}

// From a node, recursively show/hide all children and their children etc.
// Input:
//		mode: 'show' or 'hide'
function viewChildren(node,mode){
	var childs = [];
	var newchilds = [];
	if (node.children!=null)
	{childs = node.children;}
	else if (node._children!=null)
	{childs = node._children;}
	for(var i=0,tot=childs.length;i<tot;i++){
		newchilds.push(viewChildren(childs[i],mode));
	}
	if (mode=='hide'){
		node.children=null;
		node._children = newchilds;
	} else if (mode=='show'){
		if (node.type!='template'){
			node.children=newchilds;
			node._children = null;
		}
	}
	return node;
}

function maxLevel(root,height=20){
	var sum=0;
	if('children' in root & root.children!=null){
		for(var i=0,tot=root.children.length;i<tot;i++){
			sum = sum+maxLevel(root.children[i],height)
		}
		sum=sum+height;
	}
	return sum+height;
}

