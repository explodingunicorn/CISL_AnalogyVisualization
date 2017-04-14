var AnalogyGraph = function(labels) {
    var svg = d3.select("#graph");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var _HULLS = [], _NODES, _LINKS;
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

    //This is the force graph simulation
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

    this.createBestAnalogyLinks = function() {
        if(nodeGroups.length >=2 ) {
            for (var i = 0; i < nodeGroups[0].data.length; i++) {
                this.getBestAnalogy(i);
            }
        }
    }

    this.createAnalogyLinks = function() {
        if(nodeGroups.length>=2) {
            for (var i = 0; i < nodeGroups[0].data.length; i++) {
                for (var j = 0; j < nodeGroups[1].data.length; j++) {
                    this.getAnalogy(i, j);
                    console.log('getting analogy');
                }
            }
        }
    }

    this.getBestAnalogy = function(index) {
        var srcNode = nodeGroups[0].data[index];
        var feat1 = srcNode.name;
        var f1 = nodeGroups[0].key;
        var f2 = nodeGroups[1].key;
        $.ajax({
            url: 'http://localhost:5000/find_best_analogy',
            data: {
                file1: f1 + '.xml',
                file2: f2 + '.xml',
                feature: feat1,
            },
            type: 'POST',
            success: function(response) {
                var analogy = JSON.parse(response);
                if(analogy.total_score > .8) {
                    var target = analogy.target;
                    var targetNode;
                    for(var i = 0; i < nodeGroups[1].data.length; i++) {
                        if(nodeGroups[1].data[i].name === target) {
                            targetNode = nodeGroups[1].data[i];
                            break;
                        }
                    }

                    if(targetNode) {
                        linkGroups[0].data.push({source: srcNode, target: targetNode, value: analogy.total_score});
                        _HULLS[0].nodes.push(targetNode);
                        _HULLS[1].nodes.push(srcNode);
                        assembleGraph();
                        startGraph();
                    }
                }
                // linkGroups[0].data.push({source: randNode1, target: randNode2});
                // linkGroups[1].data.push({source: randNode2, target: randNode1});
                // randNode2.dupe = true;
                // nodeGroups[0].data.push(randNode2);
                // randNode1.dupe = true;
                // nodeGroups[1].data.push(randNode1);
                // assembleGraph();
                // startGraph();
                
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    this.getAnalogy = function(i, j) {
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
                if(analogy.total_score > .9) {
                    linkGroups[0].data.push({source: srcNode, target: targetNode, value: analogy.total_score});
                    _HULLS[0].nodes.push(targetNode);
                    _HULLS[1].nodes.push(srcNode);
                    assembleGraph();
                    startGraph();
                }
                // linkGroups[0].data.push({source: randNode1, target: randNode2});
                // linkGroups[1].data.push({source: randNode2, target: randNode1});
                // randNode2.dupe = true;
                // nodeGroups[0].data.push(randNode2);
                // randNode1.dupe = true;
                // nodeGroups[1].data.push(randNode1);
                // assembleGraph();
                // startGraph();
                
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    //Private function to filter our nodes when they are 
    var filterNodes = function(nodes) {
        var nodesToDisplay = [];
        var availableTargets = [];
        //Filter nodes, this changes our nodes array and returns a nodes filter array
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
    var assembleGraph = function(index, hull) {
        if(index >= 0) {
            //Filter our nodes and save the results to res
            var res = filterNodes(existingGraphs[index].data);
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

        //A for loop to push our nodes and links from their groups into one array
        for(var i = 0; i < nodeGroups.length; i++) {
            for(var j = 0; j < nodeGroups[i].data.length; j++) {
                _NODES.push(nodeGroups[i].data[j]);
            }

            for(var k = 0; k< linkGroups[i].data.length; k++) {
                _LINKS.push(linkGroups[i].data[k]);
            }
        }
    }

    //This function is used to update our graph when we add new nodes and links
    var startGraph = function() {
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
                var id = feature.getAttribute("id");
                //Return our data to nodes
                return {
                    id: id,
                    name: feature.getAttribute("data"),
                    //Make another selection, this time selecting all of our connections or Neighbors
                    connections: [].map.call(feature.querySelector("neighbors").querySelectorAll("neighbor"), function(n) {
                            return {
                                //Return the source and target
                                source: id,
                                target: n.getAttribute('dest'),
                                value: 0
                            };
                    })
                };
            });

            //Push our nodes to our existing graphs array
            existingGraphs.push({data: nodes, key: tag});
            //Assemble the graph 
            assembleGraph(existingGraphs.length-1, hull);

            //hull = new Blob('social network', nodesToDisplay, svg);
            //If we are running this for the first time append our zoom rect, and our node and link group to our svg
            if(existingGraphs.length === 1) {
                //startZoom();
                startGraph();

            }
            else {
                startGraph();
            }
            
           
        });
    }

    this.getColor = function(tag) {
        return color(tag);
    }

    //Function that runs to update the graph, or on 'tick'
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
                .attr("fill", "red");
        }
    }

    function hideLabels() {
        for (var i = 0; i < LABELS.length; i++) {
            LABELS[i].text('');
        }
    }
};