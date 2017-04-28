var AnalogyGraph = function(labels) {
    var svg = d3.select("#graph");
    var width = window.innerWidth;
    var height = window.innerHeight;

    //These are for the final assembled links and node because they need to be in the same array for d3 to read them
    var _HULLS = [], _NODES, _LINKS;
    var _NODE_GROUPS_SAVED = [];
    var _LINK_GROUPS_SAVED = [];
    var _ANALOGY_LINKS_SAVED = [];
    var _HULL_POINTS_SAVED = [];
    var hull = svg.append('g')
                    .attr('class', 'hulls');
    //Start our zoom with it's own rect before we create our nodes and links group
    startZoom();
    var link = svg.append('g')
                    .attr("class", "links")
                    .selectAll("line");
    var node = svg.append('g')
                    .attr('class', 'nodes')
                    .selectAll("circle");
    var LABELS = [svg.append('text'), svg.append('text')];
        
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    //Use this array to hold data sets the user is adding
    var existingGraphs = [];
    //This holds filtered node groups
    var nodeGroups = [];
    //this holds filtered link groups
    var linkGroups = [];

    //Placeholder for our callback resolver
    var resolver;

    //This is the force graph simulation
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

    this.cacheResults = function() {
        console.log(existingGraphs);
        $.ajax({
            url: '/',
            data: {
                key1: existingGraphs[0].key,
                key2: existingGraphs[1].key,
                analogyLinks: _ANALOGY_LINKS_SAVED,
                hullPoints: _HULL_POINTS_SAVED
            },
            type: 'POST',
            success: function(response) {
                console.log(response)
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    this.getAnalogyLinks = function() {
        var graph = this;
        $.ajax({
            url: '/requestAnalogy',
            data: {
                key1: existingGraphs[0].key,
                key2: existingGraphs[1].key,
            },
            type: 'POST',
            success: function(response) {
                if(response) {
                    graph.loadSaveData(JSON.parse(response));
                }

                else {
                    graph.createAnalogyLinks();
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    this.createAnalogyLinks = function() {
        //Create a new resolver to handle our ajax calls
        resolver = new Resolver(nodeGroups[0].data.length * nodeGroups[1].data.length, this);
        //Check if we have more than 1 node group in the graph
        if(nodeGroups.length>=2) {
            for (var i = 0; i < nodeGroups[0].data.length; i++) {
                for (var j = 0; j < nodeGroups[1].data.length; j++) {
                    getAnalogy(i, j);
                    console.log('getting analogy');
                }
            }
        }
    }

    this.loadSaveData = function(saveObj) {
        //linkGroups.push({data: saveObj.analogyLinks, key: 'Analogies'});
        //console.log(linkGroups);
        linkGroups.push({data: [], key: 'Analogies'});
        var links = saveObj.analogyLinks;
        for(var i = 0; i < links.length; i++) {
            var srcNode = nodeGroups[0].data[links[i].sourceIndex];
            var targetNode = nodeGroups[1].data[links[i].targetIndex];
            var linkValue = links[i].value;
            linkGroups[2].data.push({source: srcNode, target: targetNode, value: linkValue});
            linkGroups[2].data.push({source: srcNode, target: targetNode, value: linkValue});
            linkGroups[2].data.push({source: srcNode, target: targetNode, value: linkValue});
        }

        var hullPoints = saveObj.hullPoints;
        for(var i = 0; i < hullPoints.length; i++) {
            _HULLS[hullPoints[i].hullNum].nodes.push(nodeGroups[hullPoints[i].targetNodeGroup].data[hullPoints[i].index]);
        }

        assembleGraph();
    }

    //Used to send our ajax call to the analogy server
    var getAnalogy = function(i, j) {
        //Use our saved data for the data we push back to our server
        var srcNodeSave = _NODE_GROUPS_SAVED[0].data[i];
        var targetNodeSave = _NODE_GROUPS_SAVED[1].data[j];

        //Setting variables for our object that we are posting
        var srcNode = nodeGroups[0].data[i];
        var targetNode = nodeGroups[1].data[j];
        var feat1 = srcNode.name;
        var feat2 = targetNode.name;
        var f1 = nodeGroups[0].key;
        var f2 = nodeGroups[1].key;
        $.ajax({
            url: 'http://localhost:5000/get_analogy',
            data: {
                file1: f1 + '.xml',
                file2: f2 + '.xml',
                feature1: feat1,
                feature2: feat2,
            },
            type: 'POST',
            success: function(response) {
                var analogy = JSON.parse(response);
                //Push a new link with the correct target and source if the score is greater than .9
                if(analogy.total_score > .9) {
                    //Add a link to our links saved group
                    _ANALOGY_LINKS_SAVED.push({sourceIndex: i, targetIndex: j, value: analogy.total_score});
                    //Add a reference index number, the hull group number and target group number to hulls saved
                    _HULL_POINTS_SAVED.push({hullNum: 0, targetNodeGroup: 1, index: j});
                    _HULL_POINTS_SAVED.push({hullNum: 1, targetNodeGroup: 0, index: i});

                    //Also do this stuff for the graph currently on screen.
                    linkGroups[0].data.push({source: srcNode, target: targetNode, value: analogy.total_score});
                    _HULLS[0].nodes.push(targetNode);
                    _HULLS[1].nodes.push(srcNode);
                    assembleGraph();
                }
                //Push to our resolver which will check if this was the last callback
                console.log('Push callback');
                pushCallback();
                
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    var pushCallback = function() {
        resolver.push(1);
    }

    //Private function to filter our nodes when they are 
    var filterNodes = function(nodes) {
        //Used to hold the nodes that will be sent back
        var nodesToDisplay = [];
        //Used to hold true/false for available nodes
        var availableTargets = [];
        //Filter nodes, this changes our nodes array and returns a nodes filter array which contains the indexes of nodes to keep
        var nodesFilter = (function() {
            //Fill this array with 1's or 0's at the nodes ID depending on if the node meets the requirements
            var arr = [];
            for(var i = 0; i < nodes.length; i++) {
                if(nodes[i].connections.length > 5) {
                    availableTargets[parseInt(nodes[i].id)] = 1;
                    arr.push(i);
                }
                else {
                    // Set our node filter place to true
                    availableTargets[parseInt(nodes[i].id)] = 0;
                }
            }
            return arr;
        })();

        var links = (function() {
            var linksArr = [];
            var linksTargets = [];
            var nodesToCheck = []
            for(var i = 0; i < nodesFilter.length; i++) {
                var hasConnections = false;
                //Set our index to an integer that references the position in all of the nodes
                var nodesFilterIndex = nodesFilter[i];
                nodesToDisplay.push(nodes[nodesFilterIndex]);
                for(var j = 0; j < nodesToDisplay[i].connections.length; j++) {
                    var targetId = parseInt(nodesToDisplay[i].connections[j].target)
                    //Checking if this node has an outgoing connection with a target
                    if(availableTargets[targetId]) {
                        linksArr.push(nodes[nodesFilterIndex].connections[j]);
                        hasConnections = true;
                        linksTargets[targetId] = 1;
                    }
                }
                if(!hasConnections) {
                    nodesToCheck.push({node: nodes[nodesFilterIndex], index: i});
                }
            }

            //To check if a node has an incoming connection
            var nodesRemoved = 0;
            for(var i = 0; i < nodesToCheck.length; i++) {
                var id = parseInt(nodesToCheck[i].node.id);
                if(!linksTargets[id]) {
                    nodesToDisplay.splice(nodesToCheck[i].index - nodesRemoved, 1);
                    nodesRemoved += 1;
                }
            }
            return linksArr;
        })();

        return {
            nodes: nodesToDisplay,
            links: links
        }
    }

    //Assembles all of our nodes and links into 2 arrays
    var assembleGraph = function(index) {
        //This makes sure the nodes are filtered over one time
        if(index >= 0) {
            var copy = existingGraphs[index].data.slice();
            //Filter our nodes/links and save the results to res
            var res = filterNodes(copy);
            //Copy the arrays
            var resNodes = res.nodes.slice();
            var resLinks = res.links.slice();
            //Push the nodes, and links to our node groups, and link groups
            nodeGroups.push({data: resNodes, key: existingGraphs[index].key});
            linkGroups.push({data: resLinks, key: existingGraphs[index].key});

            var points = nodeGroups[index].data.slice()
            _HULLS.push(new Blob(existingGraphs[index].key, points, hull));
        }

        //Reset our nodes and links
        _NODES = [];
        _LINKS = [];

        //A for loop to push our nodes and links from their groups into single arrays
        for(var i = 0; i < nodeGroups.length; i++) {
            for(var j = 0; j < nodeGroups[i].data.length; j++) {
                _NODES.push(nodeGroups[i].data[j]);
            }            
        }

        for(var i = 0; i < linkGroups.length; i++) {
            for(var j = 0; j< linkGroups[i].data.length; j++) {
                _LINKS.push(linkGroups[i].data[j]);
            }
        }
        
        //On the initial assemble copy our nodes and links to be cached
        if(index >= 0 ) {
            _NODE_GROUPS_SAVED.push(JSON.parse(JSON.stringify(nodeGroups[index])));
            _LINK_GROUPS_SAVED.push(JSON.parse(JSON.stringify(linkGroups[index])));
            console.log(_LINK_GROUPS_SAVED);

        }

        updateGraph();
    }

    //This function is used to update our graph when we add new nodes and links
    var updateGraph = function() {
        //Using D3's enter to see what nodes have entered, and append them
        node = node.data(_NODES).enter().append("circle")
                .attr("r", function(d) { return d.connections.length || 1 })
                .attr("fill", function(d) { return 'white'; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .merge(node);
        
        //Using D3's enter to see what links have entered, and append them
        link = link.data(_LINKS).enter().append("line")
                .attr('stroke', 'black')
                .attr("stroke-width", 3)
                .merge(link);

        link.attr('stroke-width', function(d) {
            if (d.value) {
                return d.value * 10;
            }
            else {
                return 3;
            }
        })
        .on('mouseover', linkHoverIn)
        .on('mouseout', linkHoverOut);
        
        //These functions restart our force graph
        simulation
            .nodes(_NODES)
            .on('tick', ticked);
        
        simulation.force("link")
            .links(_LINKS);

        simulation.alpha(1).restart();
    }
    //Function for loading a new data set, the only public function on this class
    this.loadDataSet = function(dataSetName, tag) {
        //D3 function to read our XML
        d3.xml(dataSetName, function(error, graph) {

            //Have to grab AIMind, then Features, then Feature first to get the XML tags we need
            var dataFeatures = graph.querySelector("AIMind").querySelector("Features").querySelectorAll("Feature");
            //Setting nodes to whatever is returned after we read the data, using map to create a new array
            var nodes = [].map.call(dataFeatures, function(feature) {
                //Setting the features ID to a variable to be used elsewhere
                var featureId = feature.getAttribute("id");
                //Return our data to nodes
                return {
                    id: featureId,
                    name: feature.getAttribute("data"),
                    //Make another selection, this time selecting all of our connections or Neighbors
                    connections: [].map.call(feature.querySelector("neighbors").querySelectorAll("neighbor"), function(n) {
                            return {
                                //Return the source and target
                                source: featureId,
                                target: n.getAttribute('dest'),
                                value: 0
                            };
                    })
                };
            });

            //Push our nodes to our existing graphs array
            existingGraphs.push({data: nodes, key: tag});
            console.log(existingGraphs);
            //Assemble the graph 
            assembleGraph(existingGraphs.length-1);
        });
    }

    this.getColor = function(tag) {
        return color(tag);
    }

    //Function that runs to update the graph on 'tick'
    function ticked() {
        if(_HULLS) {
            for (var i = 0; i < _HULLS.length; i++) {
                _HULLS[i].update();
            }
        };

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })

        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }

    //Function to start our zoom in feature
    function startZoom() {
        svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .call(d3.zoom()
                    .scaleExtent([1 / 40, 4])
                    .on("zoom", zoomed));

        function zoomed() {
            node.attr('transform', d3.event.transform);
            link.attr('transform', d3.event.transform);
            for(var i = 0; i < _HULLS.length; i++) {
                _HULLS[i].shape.attr('transform', d3.event.transform);
            }

            for(var i = 0; i < LABELS.length; i++) {
                LABELS[i].attr('transform', d3.event.transform);
            }
        }
    }

    //Functions for updating our nodes when we drag them
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    function linkHoverIn(d) {
        var newWidth;
        if(d.value) {
            newWidth =  d.value * 10 + 5;
        }
        else {
            newWidth = 3 + 5;
        }
        d3.select(this).transition()
                .ease(d3.easeCircleOut)
                .duration("500")
            .attr('stroke-width', newWidth)
            .attr('opacity', 1);
        showLabels([d.source, d.target]);
    }

    function linkHoverOut(d) {
        var newWidth;
        if (d.value) {
            newWidth = d.value * 10;
        }
        else {
            newWidth = 3;
        }
        d3.select(this).transition()
                .ease(d3.easeCircleOut)
                .duration("500")
            .attr('stroke-width', newWidth)
            .attr('opacity', .3);
        hideLabels();
    }

    function showLabels(nodesArr) {
        for (var i = 0; i < nodesArr.length; i++) {
            LABELS[i].attr('x', nodesArr[i].x)
                .attr('y', nodesArr[i].y + 5)
                .text(nodesArr[i].name)
                .attr("text-anchor", "middle")
                .attr("font-family", "Source Sans Pro")
                .attr("font-size", "20px")
                .attr("fill", "#343434");
        }
    }

    function hideLabels() {
        for (var i = 0; i < LABELS.length; i++) {
            LABELS[i].text('');
        }
    }
};