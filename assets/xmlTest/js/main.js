ConvexHullGrahamScan.prototype.removePoints = function() {
    this.points = [];
}

var lineFunction = d3.line()
                      .x(function(d) { return d.x; })
                      .y(function(d) { return d.y; });

var Blob = function(group, graphNodes, graphSvg) {
    this.group = group;
    this.nodes = graphNodes;
    //this.nodes.push(node);
    this.hull = new ConvexHullGrahamScan;
    this.shape = graphSvg.append('g')
        .append("path")
        .attr("fill", color(group))
        .attr('opacity', .3);

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

    this.printHull = function() {
        console.log(updateHull(this.nodes, this.hull));
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

var node, link, hull, nodes;
    
var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(200))
    .force("charge", d3.forceManyBody().strength(-2000))
    .force("center", d3.forceCenter(width / 2, height / 2));

var loadData = new Promise(function(resolve, reject) { 
    d3.xml("./js/data/ww2.xml", function(error, graph) {
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

        var filterTrack = 1;
        var nodesFilter = (function() {
            var arr = [];
            arr[0] = "start";
            for(var i = 0; i < nodes.length; i++) {
                if(nodes[i].connections.length < 5) {
                    arr[filterTrack] = 0;
                    nodes.splice(i, 1);
                    i--;
                }
                else {
                    arr[filterTrack] = 1;
                }
                filterTrack++;
            }
            return arr;
        })();

        var links = (function() {
            var linksArr = [];
            console.log(nodesFilter);
            for(var i = 0; i < nodes.length; i++) {
                if(nodes[i].connections.length > 0)  {
                    var hasConnections = false;
                    for(var j = 0; j < nodes[i].connections.length; j++) {
                        var sourceIndex = parseInt(nodes[i].connections[j].source)
                        var targetIndex = parseInt(nodes[i].connections[j].target)
                        if(nodesFilter[sourceIndex] && nodesFilter[targetIndex]) {
                            linksArr.push(nodes[i].connections[j]);
                            hasConnections = true;
                        }
                    }
                    if(!hasConnections) {
                        console.log('no connections');
                    }
                }
            }
            return linksArr;
        })();

        hull = new Blob('social network', nodes, svg);
        startZoom();

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
                .data(nodes)
                .enter().append("circle")
                .attr("r", function(d) { return d.connections.length * 2 })
                .attr("fill", function(d) { return 'white'; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

        node.append("title")
            .text(function(d) { return d.id; });

        simulation
            .nodes(nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

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
        
    }
}, function() {
    console.log('error');
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
        console.log('hi');
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