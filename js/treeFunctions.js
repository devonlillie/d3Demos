// Notes:
//		Each node has at least  'name','children' and '_children'
//			* name is a string
//			* children and _children are lists

// Show/hide all children recursively
function viewChildren(node,mode){
	var childs = [];
	var newchilds = [];
	if (('children' in node )==false) return node;
	if (node.children.length>0)
	{childs = node.children;}
	else if (node._children.length>0)
	{childs = node._children;}
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
	return [].concat(node.children).concat(node._children);
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

function focusView(d) {
	var crnt = d;
	var prev = null;
	var children = null;
	while (crnt.parent & crnt.parent!=null) {
		children = [prev];
		prev=crnt;
		crnt = crnt.parent;
		crnt.children = children;
	}
	//crnt is the root at this point
	return crnt
}

// Given a tree node with it's depth if it is past the maxdepth hide its children
// else show all of its children.
function minTree(node,depth,maxdepth){
	var c = allChildren(node);
	var cnodes = [];
	for (var i=0,tot= c.length; i<tot;i++){
		cnodes.push(minTree(c[i],depth+1));
	}
	
	if (depth < (maxdepth-1)){
		node.children = cnodes;
		node._children=[];
	} else {
		node._children = cnodes;
		node.children=[];
	}
	return node;
}
