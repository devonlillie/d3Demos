// Notes:
//		Each node has at least  'name','children' and '_children'
//			* name is a string
//			* children and _children are lists

// Show/hide all children recursively
function viewChildren(node,mode){
	var childs = allChildren(node);
	var newchilds = [];
	for(var i=0,tot=childs.length;i<tot;i++){
		newchilds.push(viewChildren(childs[i],mode));
	}
	if (mode=='hide'){
		node.children=[];
		node._children = newchilds;
	} else if (mode=='show'){
		if (node.type!='template'){
			node.children=newchilds;
			node._children = [];
		}
	}
	return node;
}

//Tallest level of the tree
function maxLevel(node,height=0){
	var sum=0;
	if('children' in node) {
		for(var i=0,tot=node.children.length;i<tot;i++){
			sum = sum+maxLevel(node.children[i],height)
		}
		sum=sum+height;
	}
	return sum+height;
}

function simplify(d){
	var focus = d;
	var children = d.data;
	var parent;
	while (focus.parent!=null){
		parent = focus.parent.data;
		parent.children = [children];
		children = parent;
		focus = focus.parent;
	}
	return parent;
}

// Returns the maximium depth of child paths
function maxDepth(node,depth){
	if(('children' in node) & (node['children'].length>0)){
		m=0;
		for(var i=0,tot=node.children.length;i<tot;i++){
			m = Math.max(m,maxDepth(node.children[i]));
		}
		m=m+1;
		return m;
	}
	else {
		return 0;
	}
}

// Only on the data, not on the d3 tree structure unless specifically
//applied to the node.data object
function allChildren(node){
	return [].concat(node.children).concat(node._children.filter(function(d){
		for (var i=0,tot=node.children.length;i<tot;i++){
			if (d.name==node.children[i].name){
				return false;
			}
		}
		return true;}));
}


// Given node of nested json structure, recurse through the nodes
//to create a flat list of all nodes with dependencies still present
//change shape of node based on attributes
// Output:
//	output['links']: list of link objects 
//	output['nodes']: list of node objects
function flatten(node){
		var nodes =[];
		var links = [];
		var ind = 0;
		function recurse(node){
				if (node.children) node.children.forEach(recurse);
				nodes.push(node);
				if(node.parent){
						links.push({source:node.parent,target:node.id,index:++ind});
				}
		}
		recurse(node);
		return {nodes:nodes,links:links};
}

function focusView(root,id) {
	function recurse(parent){
		var temp_children = allChildren(parent);
		var found = [];
		var hidden = [];
		for(var i=0,tot=temp_children.length;i<tot;i++){
			if (temp_children[i].name==id){
				var finalNode = temp_children[i];
				parent.children = [finalNode];
				parent._children = temp_children.filter(function(d){return d.name!=finalNode.name;});
				return parent;
			} else if (temp_children[i].type=='dummy' & temp_children[i].parent==id){
				var finalNode = temp_children[i];
				parent.children = [finalNode];
				parent._children = temp_children.filter(function(d){return d.name!=finalNode.name;});
				return parent;
			}
			var path = recurse(temp_children[i]);
			if (path.children.length>0)
			{found.push(path);}
			else {hidden.push(path);}
		}
		parent.children = found;
		parent._children = hidden;
		return parent;
	}
	$('#detailname').html(id).attr('value',id);
	return recurse(root);
}

// Given a tree node with it's depth if it is past the maxdepth hide its children
// else show all of its children.
function minTree(node,depth,maxdepth){
	
	var c = allChildren(node);
	var cnodes = [];
	for (var i=0,tot= c.length; i<tot;i++){
		cnodes.push(minTree(c[i],depth+1,maxdepth));
	}
	
	if (depth < (maxdepth - 1)){
		node.children = cnodes;
		node._children=[];
	} else {
		node._children = cnodes;
		node.children=[];
	}
	return node;
}
