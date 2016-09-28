var app = angular.module('d3Plot',[]);

app.controller('d3PlotController',['$scope','$http',function($scope,$http){
	$scope.svg = d3.select("svg");
	$scope.width = +$scope.svg.attr("width");
	$scope.height = +$scope.svg.attr("height");
	var centx = $scope.width/2, 
		centy = $scope.height/2;
		
	$scope.color = d3.scaleOrdinal(d3.schemeCategory20);
	
	$scope.simulation = d3.forceSimulation()
		.force("link", d3.forceLink()
				.id(function(d) { return d.id; })
				.distance(75))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter($scope.width / 2, $scope.height / 2));	
	
	$http.get('/json/graph/').then(function successCallback(response){
		$scope.graph = response.data;
		console.log($scope.graph);
		$scope.setData(response.data);
	}, function errorCallback(response){
		alert('Bad data call');
	});
	
	
	// Initializes the graph
	$scope.setData = function(graph){
	  var nodes = graph.suites
		.concat(graph.tools)
 		.concat(graph.home);
 		
	  var links = graph.hierarchy;
	    
	  $scope.link = $scope.svg.append("g")
		  .attr("class", "links")
		.selectAll("line")
		.data(links)
		.enter().append("line")
		  .attr('type','hierarchy')
		  .attr('parent',function(d){return d.source;})
		  .attr('child',function(d){return d.target;});

	  $scope.node = $scope.svg.append("g")
		  .attr("class", "nodes")
		.selectAll("circle")
		.data(nodes)
		.enter().append("circle")
		  .attr("r", function(d){if(d.type=='tool'){return 5;}
				else if(d.type=='suite'){return 30;}
				else {return 20;}})
		  .attr("fill", function(d) { return $scope.color(d.parent); })
		  .attr('id',function(d){return d.id;})
		  .call(d3.drag()
			  .on("start", dragstarted)
			  .on("drag", dragged)
			  .on("end", dragended));
			  
		$scope.text = $scope.svg.selectAll("text")
			  .data(nodes)
			  .enter()
			  .append("text")
			.text( function(d){return d.display;} )
			  .attr("font-size", "10px")
			  .attr('type',function(d){return d.type;});
			  
		simulation
      		.nodes($scope.node)
      		.on("tick", ticked);

 		simulation.force("link")
      		.links(links);

		}
		
		var centerNode = d3.select('#TEIMS')
			.attr('r',40)
			.attr("fill", function(d) { return color(d.parent); })
			.attr('id',function(d){return d.id;})
			.attr('x',$scope.width/2).attr('y',$scope.height/2)
			.attr('px',$scope.width/2).attr('py',$scope.height/2)
			.attr('type',function (d){return d.type;});
			
		var suiteText = d3.selectAll('[type=suite]')
			.attr('font-size','14px')
			.attr('fill','white')
			.attr("text-anchor", "middle");

		var subsuiteText = d3.selectAll('[type=subsuite]')
			.attr('fill','white')
			.attr('text-anchor','middle');

		var toolText = d3.selectAll('[type=tool]') 
			.attr('fill','dark grey')
			.attr('text-anchor','start');
		

//Helper functions for handling events i.e. drag, click etc

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
 $scope.simulation.restart();
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) $scope.simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
 $scope.simulation.stop();
}

function ticked() {
    $scope.link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    $scope.node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })


   suiteText
	.attr('transform',moveNode);
   subsuiteText
	.attr('transform',moveNode);
   toolText
	.attr('text-anchor',rotateTextAnchor)
	.attr('transform',transformNode);
   }
	
}]);


function angle(edge) {
  var dy = edge.target.y- edge.source.y;
  var dx = edge.target.x - edge.source.x;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  return theta;
}

function getEdge(child){
	return d3.selectAll('line[type=hierarchy][child="'+child+'"]');
}

function translateD(d){
	var dist = Math.sqrt( (d.x-width/2)*(d.x-width/2) + (d.y-height/2)*(d.y-height/2));
	if(dist>300){
		var tempx = d.x-(d.x-width/2)*.10;
		var tempy = d.y-(d.y-height/2)*.10;
		return 'translate('+tempx+','+tempy+')';
	}
	else{
		return 'translate('+d.x+','+d.y+')';;
	}
}

function moveNode(d){
     return 'translate('+d.x+','+d.y+')'; }

function rotateText(d){
        var edge = getEdge(d.id);
        if (edge.data()[0]==null){ var a=0;}
        else{ var a = angle(edge.data()[0]);}
        return 'translate('+d.x+','+d.y+')';
}

function rotateTextAnchor(d){
	var edge = getEdge(d.id);
	if (edge.data()[0]==null){return 'middle';}
	else{ 
		var a = angle(edge.data()[0]);
		if( Math.abs(a)>80 & Math.abs(a)<100){return 'middle';}
		else if (Math.abs(a)>100){return 'end';}
		else{return 'start';}
	}
}
