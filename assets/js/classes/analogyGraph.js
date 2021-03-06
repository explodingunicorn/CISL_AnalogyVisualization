var AnalogyGraph = function() {
    var svg = d3.select("#graph");
    var width = window.innerWidth;
    var height = window.innerHeight;

    //These are for the final assembled links and node because they need to be in the same array for d3 to read them
    var _HULLS = [], _NODES = [], _LINKS = [], _ANALOGIES = [];

    //Begin to append our groups to the svg
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
    var labels = [svg.append('text'), svg.append('text')];

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

    //This sends a post request to our server to cache our results
    this.cacheResults = function() {
        $.ajax({
            url: '/',
            data: {
                key1: existingGraphs[0].key,
                key2: existingGraphs[1].key,
                analogies: _ANALOGIES
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

    //Sends a post request to our server to get an analogies
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
                //If we get a response back that means we have cached results already so we will use those
                if(response) {
                    graph.loadSaveData(JSON.parse(response));
                }

                //If not we need to do the calculations again
                else {
                    graph.createAnalogyLinks();
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    //Called to create our analogy links. Loops through all data and gets an analogy for each pair.
    this.createAnalogyLinks = function() {
        //Create a new resolver to handle our ajax calls
        resolver = new Resolver(nodeGroups[0].data.length * nodeGroups[1].data.length, this);
        //Check if we have more than 1 node group in the graph
        if(nodeGroups.length>=2) {
            for (var i = 0; i < nodeGroups[0].data.length; i++) {
                for (var j = 0; j < nodeGroups[1].data.length; j++) {
                    getAnalogy(i, j);
                }
            }
        }
    }

    //This loads in our cached analogies
    this.loadSaveData = function(saveObj) {
        //Create a new link group
        linkGroups.push({data: [], key: 'Analogies'});
        //Get our cached analogies in order to create new links in our graph
        _ANALOGIES = saveObj.analogies;
        //This is inefficient right now, but we loop through all of our analogies, then loop through each nodeGroup to find the correct node    
        for (var i = 0; i < _ANALOGIES.length; i++) {
            var src, target
            for (var j = 0; j < nodeGroups[0].data.length; j++) {
                if (_ANALOGIES[i].src === nodeGroups[0].data[j].name) {
                    src = nodeGroups[0].data[j];
                }
            }

            for (var j = 0; j < nodeGroups[1].data.length; j++) {
                if (_ANALOGIES[i].target === nodeGroups[1].data[j].name) {
                    target = nodeGroups[1].data[j];
                }
            }

            //After we find the correct node we push some links to our analogy link group, the more links we push the stronger the bond
            linkGroups[2].data.push({source: src, target: target, value: _ANALOGIES[i].total_score, strength: 1});
            linkGroups[2].data.push({source: src, target: target, value: _ANALOGIES[i].total_score, strength: 1});
            linkGroups[2].data.push({source: src, target: target, value: _ANALOGIES[i].total_score, strength: 1});
            linkGroups[2].data.push({source: src, target: target, value: _ANALOGIES[i].total_score, strength: 1, analogy: _ANALOGIES[i].mapping});

            //We also need to push the nodes from our opposing graphs to one anothers hulls
            _HULLS[0].nodes.push(target);
            _HULLS[1].nodes.push(src);
        }

        assembleGraph();
    }

    //Used to send our ajax call to the analogy server
    var getAnalogy = function(i, j) {
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
                    _ANALOGIES.push(analogy);

                    //Also do this stuff for the graph currently on screen.
                    linkGroups[0].data.push({source: srcNode, target: targetNode, value: analogy.total_score});
                    _HULLS[0].nodes.push(targetNode);
                    _HULLS[1].nodes.push(srcNode);
                    assembleGraph();
                }
                //Push to our resolver which will check if this was the last callback
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
                if(nodes[i].connections.length > 4) {
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
            var key = existingGraphs[index].key;
            //Push the nodes, and links to our node groups, and link groups
            nodeGroups.push({data: resNodes, key: key});
            linkGroups.push({data: resLinks, key: key});

            var points = nodeGroups[index].data.slice()
            _HULLS.push(new Blob(key, points, hull, existingGraphs[index].color));
        }


        //Reset our nodes and links
        _NODES = [];
        _LINKS = [];

        //Master nodes are invisible nodes that will link node groups data together if it is n
        var masterNodes = [];
        var masterLinkGroups = [];

        //{source: srcNode, target: targetNode, value: analogy.total_score}

        //A for loop to push our nodes and links from their groups into single array
        for(var i = 0; i < nodeGroups.length; i++) {
            masterNodes.push({name: nodeGroups[i].key, connections: 1, type: 'master'});
            _NODES.push(masterNodes[i]);
            var newLinks = [];
            for(var j = 0; j < nodeGroups[i].data.length; j++) {
                var node = nodeGroups[i].data[j];
                _NODES.push(node);
                newLinks.push({source: masterNodes[i], target: node, type: 'master'})
            }
            masterLinkGroups.push(newLinks);            
        }

        //A loop to push our normal links from their groups into a single array
        for(var i = 0; i < linkGroups.length; i++) {
            for(var j = 0; j< linkGroups[i].data.length; j++) {
                _LINKS.push(linkGroups[i].data[j]);
                
            }
        }

        //A loop to push our master, invisible links into the same array
        for(var i = 0; i < masterLinkGroups.length; i++) {
            for(var j = 0; j < masterLinkGroups[i].length; j++) {
                _LINKS.push(masterLinkGroups[i][j]);
            }
        }

        updateGraph();
    }

    //This function is used to update our graph when we add new nodes and links
    var updateGraph = function() {
        //Using D3's enter to see what nodes have entered, and append them
        node = node.data(_NODES).enter().append("circle")
                .attr("r", function(d) { 
                    if (d.connections.length < 20) {
                        return d.connections.length || 1;
                    }
                    else {
                        return 21;
                    }
                })
                .attr("fill", function(d) { 
                    if (d.type === 'master') {
                        return 'transparent';
                    }
                    else {
                        return 'white'; 
                    }
                })
                .merge(node);
        
        //Using D3's enter to see what links have entered, and append them
        link = link.data(_LINKS).enter().append("line")
                .attr('class', function(d) {
                    if(d.value) {
                        return 'analogy';
                    }
                    else if(d.type === 'master') {
                        return 'master';
                    }
                    else {
                        return 'connection';
                    }
                })
                .attr("stroke-width", 3)
                .merge(link);

        link.attr('stroke-width', function(d) {
            if (d.value) {
                return d.value * 5;
            }
            else {
                return 3;
            }
        })
        .on('mouseover', linkHoverIn)
        .on('mouseout', linkHoverOut)
        .on('mousedown', stepAnalogy);
        
        //These functions restart our force graph
        simulation
            .nodes(_NODES)
            .on('tick', ticked);
        
        simulation.force("link")
            .links(_LINKS);

        simulation.alpha(1).restart();
    }
    //Function for loading a new data set, the only public function on this class
    this.loadDataSet = function(dataSetName, tag, color) {
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
            existingGraphs.push({data: nodes, key: tag, color});
            //Assemble the graph 
            assembleGraph(existingGraphs.length-1);
        });
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

            for(var i = 0; i < labels.length; i++) {
                labels[i].attr('transform', d3.event.transform);
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
            newWidth =  d.value * 5 + 5;
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
            newWidth = d.value * 5;
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

    function stepAnalogy(d) {
        console.log(d.analogy);
    }

    function showLabels(nodesArr) {
        for (var i = 0; i < nodesArr.length; i++) {
            labels[i].attr('x', nodesArr[i].x)
                .attr('y', nodesArr[i].y + 5)
                .text(nodesArr[i].name)
                .attr("text-anchor", "middle")
                .attr("font-family", "Source Sans Pro")
                .attr("font-size", "20px")
                .attr("fill", "#343434");
        }
    }

    function hideLabels() {
        for (var i = 0; i < labels.length; i++) {
            labels[i].text('');
        }
    }
};