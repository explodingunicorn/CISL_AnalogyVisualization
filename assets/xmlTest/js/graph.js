ConvexHullGrahamScan.prototype.removePoints = function() {
    this.points = [];
}

var lineFunction = d3.line()
                      .x(function(d) { return d.x; })
                      .y(function(d) { return d.y; });

var Blob = function(group, node) {
    this.group = group;
    this.nodes = [];
    this.nodes.push(node);
    this.hull = new ConvexHullGrahamScan;
    this.shape = svg.append("path")
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
        var center = getCenter(this.nodes);
        this.hull.anchorPoint = center;
        var hull = updateHull(this.nodes, this.hull);
        this.shape
            .attr("d", lineFunction(hull))
            .attr('transform', 'translate('+ -center.x*.5 + ' ' + -center.y*.5 +')' + 'scale(1.5)');
    }
}

var hulls = [];

var createBlobs = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var noGroup = true;
        for (var j = 0; j < hulls.length; j++) {
            if(hulls[j].group === nodes[i].group) {
                hulls[j].nodes.push(nodes[i]);
                noGroup = false;
                break;
            }
        }
        if (hulls.length === 0) {
            hulls.push(new Blob(nodes[i].group, nodes[i]));
        }
        if(noGroup) {
            hulls.push(new Blob(nodes[i].group, nodes[i]));
        }
    }
}

var updateBlobs = function() {
    for (var i = 0; i < hulls.length; i++) {
        hulls[i].update();
    }
}

var svg = d3.select("svg"),
    width = window.innerWidth,
    height = window.innerHeight;


var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

var linkHovered = {source: 0, target: 0, hover: false};
var node;

d3.json("./js/data/miserables.json", function(error, graph) {
    if (error) throw error;

    createBlobs(graph.nodes);

    var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", function(d) { return d.value; })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

    node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("r", 5)
            .attr("fill", function(d) { return color(d.group); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        // var center = getCenter(nodesArr);
        // var hull = createHull(nodesArr, convexHull);
        // lineGraph.attr('d', lineFunction(hull))
        //     .attr('opacity', .5)
        //     .attr('transform', 'translate('+ -center.x*.3 + ' ' + -center.y*.3 +')' + 'scale(1.3)');
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            // .attr('fill', function(d) {
            //     if(linkHovered.hover) {
            //         if(d.index === linkHovered.source || d.index === linkHovered.target) {
            //             return 'red';
            //         }
            //         else {
            //             return color(d.group);
            //         }
            //     } else {
            //         return color(d.group);
            //     }
            // });

        // if(linkHovered) {
        //     console.log(node);
        //     console.log(node._groups[0][linkHovered.source]);
        //     d3.select(node._groups[0][linkHovered.source]).attr('fill', 'red');
        //     d3.select(node._groups[0][linkHovered.target]).attr('fill', 'red');
        // }

        updateBlobs();
    }
});

function mouseover(d) {
    d3.select(this).transition().attr('stroke-width', function(d) { return d.value + 2; });

    var linkData = d;
    node.transition().attr('fill', function(d) {
        if(d.index === linkData.source.index || d.index === linkData.target.index) {
            return 'red';
        }
        else {
            return color(d.group);
        }
    })
        .attr('r', function(d) {
            if(d.index === linkData.source.index || d.index === linkData.target.index) {
                return 10;
            }
            else {
                return 5;
            }
    });


    var display1 = $('#node1');
    var display2 = $('#node2');
    display1.text(d.source.id);
    display1.css({
        'top' : (d.source.y - (display1.innerHeight() + 15)) + 'px',
        'left' : (d.source.x - (display1.innerWidth()/2)) + 'px'
    })
    display2.text(d.target.id);
    display2.css({
        'top' : (d.target.y - (display2.outerHeight() + 15)) + 'px',
        'left' : (d.target.x - (display2.outerWidth()/2)) + 'px'
    });
}

function mouseout() {
    d3.select(this).transition().attr('stroke-width', function(d) { return d.value });
    node.transition().attr('fill', function(d) { return color(d.group)})
        .attr('r', 5);

    $('#node1').css({
        'top' : 0,
        'left' : 0
    })

    $('#node2').css({
        'top' : 0,
        'left' : 0
    })
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
