var svg = d3.select("svg"),
    width = window.innerWidth,
    height = window.innerHeight

var node, link;
    
var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(200))
    .force("charge", d3.forceManyBody().strength(-2000))
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.xml("./js/data/techData.xml", function(error, graph) {
    console.log(graph);

    var dataFeatures = graph.querySelector("AIMind").querySelector("Features").querySelectorAll("Feature");
    var nodes = [].map.call(dataFeatures, function(feature) {
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
            if(nodes[i].connections.length < 10) {
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
                for(var j = 0; j < nodes[i].connections.length; j++) {
                    var sourceIndex = parseInt(nodes[i].connections[j].source)
                    var targetIndex = parseInt(nodes[i].connections[j].target)
                    if(nodesFilter[sourceIndex] && nodesFilter[targetIndex]) {
                        linksArr.push(nodes[i].connections[j]);
                    }
                }
            }
        }
        return linksArr;
    })();

    console.log(nodes);
    console.log("Links: ", links);

    link = svg.append('g')
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", '1');

    node = svg.append('g')
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 5)
            .attr("fill", function(d) { return color(d.id); })
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
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
    }
});

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

var counter = 0;
function simulateTick() {
    counter++;

    if (counter === 5) {
        //simulation.stop();
        console.log('stopped');
    }

    window.requestAnimationFrame(simulateTick);
}

window.requestAnimationFrame(simulateTick);

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .call(d3.zoom()
        .scaleExtent([1 / 10, 4])
        .on("zoom", zoomed));;

function zoomed() {
    node.attr('transform', d3.event.transform);
    link.attr('transform', d3.event.transform);
}