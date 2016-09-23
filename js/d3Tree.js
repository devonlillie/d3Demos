function makeButtons(data,navbar,cl,sh,size){ 
	for (var i =0,tot = data.length;i<tot;i++){
		data[i].x = i*size[0]+20;
		data[i].y = 10;
	}
	var buts = navbar
		.selectAll('.'+cl)
		.data(data).enter()
		.append(sh)
			.on('click',function(d){ d.click();})
			.attr('class',cl)
			.attr('fill','lightgrey')
			.attr('height',size[1])
			.attr('width',size[0])
			.attr('transform',function(d){
				return 'translate('+d.x+','+d.y+')';});			
	var btext = navbar
		.selectAll('.'+cl+'text')
		.data(data).enter()
		.append('text')
			.text(function(d){return d.text;})
			.attr('transform',function(d){
				return 'translate('+Number(10+d.x)+','+Number(size[1])+')';});;
	return buts,btext;
}

function makeLinks(tree,svg){
	// Create links(path elements) from $scope.nodes list
	// Attributes:
	//	'class': "link" + "link--external" if url is not in TEIMS 
	//	'd': curve definition of path
	// CSS:
	//	stroke, stroke-width, opacity
	return svg.selectAll(".link")
		.data(tree.descendants().slice(1))
		.enter().append("path")
			.attr("class","link")
			.attr("d", curveLink);
}

function makeNodes(tree,svg){
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
		return svg.selectAll('.node')
			.data(tree.descendants()).enter()
			.append('circle')
				.attr('class',function(d){return 'node node--'+classify(d);})
				.attr('r',5)
				.attr('transform',move)
				.attr('id',function(d){return d.data.name;});
}

function makeTexts(tree,svg){
	// Text objects created from node.label data
	// Attributes:
	//	'class': {'leaf','internal','cluster'}
	//	'text-anchor': depends on class of attached node
	//	'transform' : shifts text depending on where text-anchor is
	//	to avoid occluding node shape
	// CSS:
	//	font-family, font-size,
	return svg.selectAll('.name')
		.data(tree.descendants()).enter()
		.append('text')
			.attr('class','name node--name')
			.attr('text-anchor','start')
			.text(function(d){return d.data.label;});
}

function makeDependencyLinks(dependencies,svg){
	return svg.selectAll(".dependency")
		.data(dependencies)
		.enter().append("path")
			.attr("class", "dependency")
			.attr('fill',null)
			.attr("d", curveLink);
}

function makeChildrenTexts(tree,svg,f) {
	// Small numeric text that tells the number of pages being hidden by a 
	// template node.
	// Attributes:
	//	'class': template template--children
	//	'text-anchor': end
	//	'transform' : shifts text depending on where text-anchor is
	//	to avoid occluding node shape
	// CSS:
	//	None
	return svg.selectAll('.label--children')
		.data(tree.descendants().filter(f)).enter()
		.append('text')
			.attr('class','template template--children')
			.text(function(d){if(d.data._children) return d.data._children.length;})
			.attr('fill','red')
			.attr('transform',function(d){return 'translate('+(Number(d.y)-20)+','+Number(5+d.x)+')';})
			.attr('text-anchor','end');
}	

function createSvg(id){
	return d3.select(id)
		.append("svg")
		.attr('height','100%')
		.attr('width','100%')
		.attr('id','graph')
		.attr('class','nopadding')
		.append('g');
}
function curveLink(d) {
	return "M" + d.y + "," + d.x
	 + "C" + (d.y + d.parent.y) / 2 + "," + d.x
	 + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
	 + " " + d.parent.y + "," + d.parent.x;
}
function move(d){return 'translate('+d.y+','+d.x+')';}

function windowSize(){
	var w = window,
		b = document.body;
	x =  b.clientWidth || w.innerWidth;
	y = b.clientHeight || w.innerHeight;
	return{'x':x,'y':y};
}
