//Simple line function for d3 to render a line from points given to it
var lineFunction = d3.line()
                        .x(function(d) { return d.x; })
                        .y(function(d) { return d.y; })
                        .curve(d3.curveLinearClosed);

var color = d3.scaleOrdinal(d3.schemeCategory20);

ConvexHullGrahamScan.prototype.removePoints = function() {
    this.points = [];
}

var Blob = function(group, nodes, svg) {
    this.group = group;
    this.nodes = nodes;
    console.log(this.nodes);
    this.hull = new ConvexHullGrahamScan;
    this.shape = svg.append("path")
        .attr("fill", color(group))
        .attr('stroke', color(group))
        .attr('stroke-width', 40)
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
            .attr("d", lineFunction(hull));
    }
}