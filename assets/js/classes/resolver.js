//This class is a utility for handling callbacks
var Resolver = function(amt, graph) {
    var calls = amt;
    this.graph = graph;
    var completions = [];

    //Push a completed callback to our array
    this.push = function(complete) {
        completions.push(complete);
        
        if(checkComplete()) {
            console.log('Callbacks done');
            //graph.cacheResults();
        }
    }

    //If our completed callbacks length is equal to our calls set we cache our results
    function checkComplete() {
        if(completions.length === calls) {
            return true;
        }
        else {
            return false;
        }
    }
    
}