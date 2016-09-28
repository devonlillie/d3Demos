function makeButtons(data,navbar,cl,sh,size,x0){ 
	for (var i =0,tot = data.length;i<tot;i++){
		data[i].x = i*size[0]+x0
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
			.attr("class",function(d){return "link link--"+classifyLink(d);})
			.attr("d", curveLink);
}

function makeNodes(tree,svg,id){
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
			.data(tree.descendants(),function(d){return d.name;}).enter()
			.append('circle')
				.attr('class',function(d){
					var t = 'node node--'+classify(d);
					if (d.data._children.length>0){
						t=t+' hiddenChildren';}
					else if (d.data.name==id){t=t+' focus--node';}
					return t;})
				.attr('r',function(d){
					if(d.data.name==id){return 10;}
					else {return 5;}})
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

		var lines = []
		for (var i=1,tot=10;i<tot;i++){
			lines.push({'y1':i*1200/10,'y2':i*1200/10,'x1':0,'x2':1200});
		}
		
		for (var i=1,tot=6;i<tot;i++){
			lines.push({'x1':i*1200/6,'x2':i*1200/6,'y1':0,'y2':1200});
		}
		
function makeGrid(svg,w,h,nv,nh){
	// horizontal and vertical gridlines with class gridline
	// Attributes:
	//	'class': gridline
	//	'fill': 'none'
	//	can set stroke color, width,dasharray, opacity etc with css
	var lines =[];
	for (var i=1,tot=nh;i<tot;i++){
		lines.push({'x1':0,'x2':w,'y1':h/nh*i,'y2':h/nh*i});
	}
	for (var i=1,tot=nv;i<tot;i++){
		lines.push({'y1':0,'y2':h,'x1':w/nv*i,'x2':w/nv*i});
	}
	
	return svg.selectAll('.gridline')
		.data(lines).enter()
		.append('line')
		.attr('class','gridline')
		.attr('x1',function(d){return d.x1;})
		.attr('x2',function(d){return d.x2;})
		.attr('y1',function(d){return d.y1;})
		.attr('y2',function(d){return d.y2;})
		.attr('fill','none');
}

function createSvg(id,zoom){
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
