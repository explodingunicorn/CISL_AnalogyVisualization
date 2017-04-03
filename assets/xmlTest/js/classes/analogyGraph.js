var AnalogyGraph = function() {
    var svg = d3.select("svg");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var hull, _NODES, _LINKS;
    var link = svg.append('g')
                    .attr("class", "links")
                    .selectAll("line");
    var node = svg.append('g')
                    .attr('class', 'nodes')
                    .selectAll("circle");
        
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var existingGraphs = [];
    var nodeGroupsArr = [];
    var linkGroupsArr = [];

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

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
                    console.log('pushing node');
                }
                else {
                    // Set our node filter place to true
                    availableTargets[parseInt(nodes[i].id)] = 0;
                }
            }
            return arr;
        })();
        console.log(nodesFilter);

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
                        // linksFilter[targetIndex] = 1;
                        hasConnections = true;
                        linksTargets[targetId] = 1;
                    }
                }
                if(!hasConnections) {
                    nodesToCheck.push({node: nodes[nodesFilterIndex], index: i});
                }
            }

            //To check if a node has an incoming connecti
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

    var assembleGraph = function(index) {
        var res = filterNodes(existingGraphs[index]);
        var a = res.nodes.slice();
        var b = res.links.slice();
        nodeGroupsArr.push(a);
        linkGroupsArr.push(b);

        console.log(nodeGroupsArr)
        console.log(linkGroupsArr);

        _NODES = [];
        _LINKS = [];

        for(var i = 0; i < nodeGroupsArr.length; i++) {
            for(var j = 0; j < nodeGroupsArr[i].length; j++) {
                _NODES.push(nodeGroupsArr[i][j]);
            }

            for(var k = 0; k< linkGroupsArr[i].length; k++) {
                _LINKS.push(linkGroupsArr[i][k]);
            }
        }
    }

    var startGraph = function() {
        node = node.data(_NODES).enter().append("circle")
                .attr("r", function(d) { return d.connections.length || 1 })
                .attr("fill", function(d) { return 'white'; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .merge(node);

        link = link.data(_LINKS).enter().append("line")
                .attr('stroke', 'black')
                .attr("stroke-width", '3')
                .merge(link);

        simulation
            .nodes(_NODES)
            .on('tick', ticked);

        simulation.force("link")
            .links(_LINKS);

        simulation.alpha(1).restart();
    }

    var updateGraph = function() {
        link.enter().append("line")
                    .attr('stroke', 'black')
                    .attr("stroke-width", '3');

        link.exit().remove();

        node.enter().append("circle")
                .attr("r", function(d) { return d.connections.length || 1 })
                .attr("fill", function(d) { return 'white'; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged));
        
        node.exit().remove();
    }

    this.loadDataSet = function(dataSetName, tag) {
        d3.xml(dataSetName, function(error, graph) {

            var dataFeatures = graph.querySelector("AIMind").querySelector("Features").querySelectorAll("Feature");
            var nodes = [].map.call(dataFeatures, function(feature) {
                var id = feature.getAttribute("id");
                return {
                id: feature.getAttribute("id")+tag,
                name: feature.getAttribute("data"),
                connections: [].map.call(feature.querySelector("neighbors").querySelectorAll("neighbor"), function(n) {
                    return {
                        source: id+tag,
                        target: n.getAttribute('dest')+tag
                    };
                })
                };
            });

            existingGraphs.push(nodes);
            assembleGraph(existingGraphs.length-1);

            //hull = new Blob('social network', nodesToDisplay, svg);
            if(existingGraphs.length === 1) {
                startZoom();
                node = svg.append('g')
                    .attr('class', 'nodes')
                    .selectAll("circle");
                svg.append('g')
                    .attr("class", "links")
                    .selectAll("line");
                startGraph();

            }
            else {
                startGraph();
            }
        });
    }

    function ticked() {
        try {
            if(hull) {
                hull.update();
            };

            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })

            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            console.log('this working?');
        }
        catch(e) {
            console.log(e);
        }
    }

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
            //hull.shape.attr('transform', d3.event.transform);
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
};