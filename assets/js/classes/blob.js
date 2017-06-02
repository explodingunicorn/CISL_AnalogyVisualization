//Simple line function for d3 to render a line from points given to it
var lineFunction = d3.line()
                        .x(function(d) { return d.x; })
                        .y(function(d) { return d.y; })
                        .curve(d3.curveLinearClosed);

var color = d3.scaleOrdinal(d3.schemeCategory20);

ConvexHullGrahamScan.prototype.removePoints = function() {
    this.points = [];
}

var Blob = function(group, nodes, svg, fill) {
    this.group = group;
    this.nodes = nodes;
    this.hull = new ConvexHullGrahamScan;
    //Create an svg shape for our hull
    this.shape = svg.append("path")
        .attr("fill", fill)
        .attr('stroke', fill)
        .attr('stroke-width', 40)
        .attr('opacity', .6);
    
    //Calculates the center of the hull by averaging the points x and y coordinates
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

    //This updates and returns our convex hull data
    var updateHull = function(data, hull) {
        if(data.length <= 2) {
            return data;
        }

        hull.removePoints();
        for (var i = 0; i < data.length; i++) {
            hull.addPoint(data[i].x, data[i].y);
        }

        //This gets our hull data from our graham_scan file
        var newHull = hull.getHull();

        //Push the first point from our data to the back of the array in order to complete the shape
        newHull.push({
            x: newHull[0].x,
            y: newHull[0].y
        });

        return newHull;
    }

    this.printHull = function() {
        console.log(updateHull(this.nodes, this.hull));
    }
    
    //This updates the hull for the graph
    this.update = function() {
        var center = getCenter(this.nodes);
        this.hull.anchorPoint = center;
        var hullData = updateHull(this.nodes, this.hull);
        this.shape
            .attr("d", lineFunction(hullData));
    }
}