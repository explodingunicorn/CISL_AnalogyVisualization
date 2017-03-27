ConvexHullGrahamScan.prototype.removePoints = function() {
    this.points = [];
}

var lineFunction = d3.line()
                        .x(function(d) { return d.x; })
                        .y(function(d) { return d.y; })
                        .curve(d3.curveLinearClosed);

var Blob = function(group, graphNodes, graphSvg) {
    this.group = group;
    this.nodes = graphNodes;
    //this.nodes.push(node);
    this.hull = new ConvexHullGrahamScan;
    this.shape = graphSvg.append('g')
        .append("path")
        .attr("fill", color(group))
        .attr('stroke-width', 60)
        .attr('stroke', color(group))
        .attr('opacity', .7);

    var getCenter = function(data) {
        var totalX = 0, totalY = 0;
        for (var i = 0; i < data.length; i++) {
            totalX = totalX + data[i].x;
            totalY = totalY + data[i].y;
        }
        var center = {
            x: totalX/(data.length),
            y: totalY/(data.length)
        }
        return center;
    }

    var updateHull = function(data, hull) {
        if(data.length <= 2) {
            return data;
        }

        hull.removePoints();
        for (var i = 0; i < data.length; i++) {
            hull.addPoint(data[i].x, data[i].y);
        }

        var newHull = hull.getHull();
        newHull.push({
            x: newHull[0].x,
            y: newHull[0].y
        });

        return newHull;
    }

    this.update = function() {
        this.center = getCenter(this.nodes);
        this.hull.anchorPoint = this.center;
        var hull = updateHull(this.nodes, this.hull);
        this.shape
            .attr("d", lineFunction(hull));
            
    }
}

var svg = d3.select("svg"),
    width = window.innerWidth,
    height = window.innerHeight

var node, link, hull, nodes, nodesToDisplay = [];
    
var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

//Creating promise for our XML data
var loadData = new Promise(function(resolve, reject) { 
    d3.xml("../../data/big_unrestricted_techdata.xml", function(error, graph) {
        console.log(graph);

        var dataFeatures = graph.querySelector("AIMind").querySelector("Features").querySelectorAll("Feature");
        nodes = [].map.call(dataFeatures, function(feature) {
            var id = feature.getAttribute("id");
            return {
            id: feature.getAttribute("id"),
            name: feature.getAttribute("data"),
            connections: [].map.call(feature.querySelector("neighbors").querySelectorAll("neighbor"), function(n) {
                return {
                    source: id,
                    target: n.getAttribute('dest')
                };
            })
            };
        });

        var availableTargets = [];
        //Filter nodes, this changes our nodes array and returns a nodes filter array
        var nodesFilter = (function() {
            //Fill this array with 1's or 0's at the nodes ID depending on if the node meets the requirements
            var arr = [];
            for(var i = 0; i < nodes.length; i++) {
                if(nodes[i].connections.length > 10) {
                    //Set our node filter place to false
                    //Remove this node from our nodes array
                    //nodes.splice(i, 1);
                    //arr.push(i);
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
            console.log(nodesFilter);
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
                        // linksFilter[targetIndex] = 1;
                        hasConnections = true;
                        linksTargets[targetId] = 1;
                    }
                }
                if(!hasConnections) {
                    nodesToCheck.push({node: nodes[nodesFilterIndex], index: i});
                }
            }
            console.log(linksTargets);

            //To check if a node has an incoming connection
            console.log(nodesToCheck);
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

        hull = new Blob('social network', nodesToDisplay, svg);
        startZoom();

        try {
            link = svg.append('g')
                    .attr("class", "links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr('stroke', 'white')
                    .attr("stroke-width", '3');
            
            node = svg.append('g')
                    .attr("class", "nodes")
                    .selectAll("circle")
                    .data(nodesToDisplay)
                    .enter().append("circle")
                    .attr("r", function(d) { return d.connections.length || 1 })
                    .attr("fill", function(d) { return 'white'; })
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));
        

        node.append("title")
            .text(function(d) { return d.id; });

        simulation
            .nodes(nodesToDisplay)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);
        }

        catch (err) {
            console.log(err);
            simulation.stop();
        }

        function ticked() {
            if(hull) {
                hull.update();
            };

            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
        }

        

        resolve(true);
    });
});

loadData.then(function(val) {
    if (val) {
        //Runs after data, and graph is loaded
    }
}, function(err) {
    //Runs on error
    console.log(err);
});

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
        hull.shape.attr('transform', d3.event.transform);
    }
}

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