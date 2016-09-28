var app = angular.module('d3App',['rzModule']);


app.controller('d3PlotController',['$scope','$http',function($scope,$http){
	window.S = $scope;
	var windowHeight = window.innerHeight;
	var windowWidth = window.innerWidth-15;
	
	$scope.colSlider = {
			hideLimitLabels:true,
			hidePointerLabels:true,
			step:50,
			floor: 200,
			ceil: 450
	};
	
	$scope.depthSlider = {
			hideLimitLabels:true,
			hidePointerLabels:true,
			floor: 1,
			ceil: 6
	};

	var navHeight = d3.select('#navbar').node().clientHeight;
	
	$scope.height = windowHeight-navHeight-15;
	$scope.width = windowWidth;
	
	$scope.zoom = d3.zoom()
		.on("zoom",all_zoom);

	$scope.svg = d3.select('.graph');

	///****************************************///
	///***** Initialize canvas elements *******///
	///****************************************///
	// SCOPE FUNCTIONS
	$scope.reset = function(){
		$scope.colWidth = 300;
		$scope.defaultDepth = 3;
		d3.select('#graph').remove();
		
		$scope.svg = d3.select('#d3canvas')
			.append("svg")
			.attr('id','graph')
			.call($scope.zoom)
			.on("dblclick.zoom", check_click_zoom)
			.style('padding','0px')
			.style('margin','0px')
			.attr('width',windowWidth) 
			.attr('height',windowHeight-navHeight-15)
			.append('g');	
	
		$scope.svg
			.append('rect').attr('height',windowHeight-navHeight-15).attr('width',windowWidth)
			.attr('fill','none');
			
		$scope.g = $scope.svg
			.append('g')
			.attr('class','mover');
		
		$scope.objects = $scope.g.append('g')
			.attr('id','gcontainer');

		$http.get('/json/miniTeims/').then(function successCallback(response){
			$scope.graph = minTree(response.data,0,$scope.defaultDepth);
			$scope.graph.x0=0;
			$scope.graph.y0=0;
				
			$scope.nodes = defineTree($scope.graph,$scope.colWidth,10);
			$scope.selected = '';
			$scope.buildStaticTree($scope.nodes);
			$scope.transform = d3.zoomIdentity;
			click_zoom($scope.nodes);
				
			///****************************************///
			///***** Variable watchers for graph *******///
			///****************************************///
			$scope.$watch("colWidth", function(){
				if($scope.graph){
					$scope.update();
				}
			});
			//$scope.$watch("defaultDepth", function(){
			//	if($scope.graph){
			//		$scope.resetView();
			//	}
			//});
	
		}, function errorCallback(response){
			alert('Bad data call');
		});
		
		$scope.isTree=true;
		$scope.isFocused=false;
	}
	
	$scope.tree = d3.tree().size([$scope.height,$scope.width]);
	$scope.reset();

	///****************************************///
	///*               Build graph            *///
	///****************************************///
	$scope.update = function(){
		$scope.nodes = defineTree($scope.graph,$scope.colWidth,10);
		$scope.clearElements();
		$scope.buildStaticTree($scope.nodes);
	}
	
	$scope.buildStaticTree = function(tree){
		$scope.link = makeLinks(tree,$scope.objects);
		$scope.node = makeNodes(tree,$scope.objects,$scope.selected)
						.on('dblclick',collapse);
							
		//Text must be defined last so that its on top of all elements
		$scope.text = makeTexts(tree,$scope.objects)
					.attr('transform',shiftText)
					.style('cursor','pointer');
					
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
		var height = maxLevel(hierarchy,height=nodeHeight);
		var tree = d3.tree().size([height,hierarchy.height*levelWidth]);
		return tree(hierarchy);
	}
	///****************************************///
	///***** EVENT HANDLING FUNCTIONS *********///
	///****************************************///
		
	// Collapse or expand children of node
	// Note: Does not change any of the children, 
	// 	 internal structure is maintained
	function collapse(d) {
		var allchildren = allChildren(d.data);
		if (d.data.type=='dummy'){
			console.log('dummy');
		}
		else if (d.data.children.length>d.data._children.length) {
			d.data._children = allchildren;
			d.data.children = [];
			$scope.update();
		}
		else {
			d.data.children = allchildren;
			d.data._children = [];
			$scope.update();
		} 
	}
	
	// Recursively hide all children in the entire graph.
	$scope.collapseAll = function(){
		$scope.graph = viewChildren($scope.graph,mode='hide');		
		$scope.update();
		click_zoom($scope.nodes);
	}
	
	// Recursively reveal all children in the entire graph.
	$scope.showAll = function(){
		$scope.graph = viewChildren($scope.graph,mode='show');
		$scope.update();
		click_zoom($scope.nodes);
	}
	
	$scope.resetView = function(){
		$scope.graph = minTree($scope.graph,0,$scope.defaultDepth);
		$scope.update();
		click_zoom($scope.nodes);
	}
	
	function click_zoom(d){
		var y = (windowHeight-navHeight-15)/2-60,
			gbox = d3.select('#gcontainer').node().getBBox(),
			branchLength = gbox.width+$scope.colWidth/2,
			branchHeight = gbox.height,
		    z = d3.zoomIdentity;
		    
		var shiftX1 = Math.max(0,branchLength-$scope.width-d.y),
			shiftX2 = Math.min(0,$scope.width-branchLength);

		var shiftY1 = (branchHeight/2-d.y)/2,
			shiftY2 = ($scope.height-branchHeight)/2;

		var newy = shiftY2,
		   newx = shiftX1+shiftX2+100;

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
			var d = e.target.__data__;
			if(d.data.type=='dummy'){
				var new_focus = d.data.parent;	
			} else {
				var new_focus = d.data.name;	
			}
			
			if(new_focus!=$scope.selected){
				$scope.selected=new_focus;
				focusView(viewChildren($scope.graph,'show'),new_focus);
				$scope.update();
				click_zoom(d);
			} else {
				$scope.selected='';
				$scope.resetView();
			}
			
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
	if(d.data.internal==false) {c=c+' external';}
	else {c=c+' internal';}
	return c;
}


	
