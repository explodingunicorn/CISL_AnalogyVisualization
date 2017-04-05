//Creating a new vue application
var app = new Vue({
    el: '.app',
    data: {
        //Instantiate graph as null
        graph: '',
        graphMounted: false,
        selecting: false,
        //We are binding this to our data sets selection dropdown
        currentlySelected: 'music',
        //An object that holds all of the relevant info for our current data sets
        dataSelections: {
            music: {
                name: 'Music',
                val: 'music'
            },
            nfl: {
                name: 'NFL',
                val: 'nfl'
            },
            oil: {
                name: 'Oil',
                val: 'oil'
            },
            roman: {
                name: 'Roman Empire',
                val: 'romanEmpire1000'
            },
            tech: {
                name: 'Tech',
                val: 'techdata'
            },
            ww2: {
                name: 'World War II',
                val: 'ww2'
            },
        }
    },
    methods: {
        //This adds data sets to our graph using analogy graph
        addDataSet: function() {
            console.log(this.currentlySelected);
            this.graph.loadDataSet('js/data/' + this.currentlySelected + '.xml', this.currentlySelected);
            this.selecting = false;
        }
    },
    mounted: function() {
        //We are instantiating our Analogy Graph here because we need to wait for the app to mount in order for the svg to be available to d3
        this.graph = new AnalogyGraph();
        this.graphMounted = true;
    }
})