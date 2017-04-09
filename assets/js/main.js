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
        dataSetsUsed: [],
        //An object that holds all of the relevant info for our current data sets
        dataSetsAvailable: [
            {
                name: 'Music',
                val: 'music'
            },
            {
                name: 'NFL',
                val: 'nfl'
            },
            {
                name: 'Oil',
                val: 'oil'
            },
            {
                name: 'Roman Empire',
                val: 'romanEmpire1000'
            },
            {
                name: 'Tech',
                val: 'techdata'
            },
            {
                name: 'World War II',
                val: 'ww2'
            },
        ],

    },
    methods: {
        //This adds data sets to our graph using analogy graph
        addDataSet: function() {
            var tag = this.currentlySelected;
            this.graph.loadDataSet('js/data/' + tag + '.xml', tag);
            var newColor = this.graph.getColor(tag);
            this.selecting = false;
            console.log(newColor);
            this.dataSetsUsed.push({name: this.currentlySelected, color: newColor});
        },
        generateAnalogy: function() {
            this.graph.getAnalogy();
        }
    },
    mounted: function() {
        //We are instantiating our Analogy Graph here because we need to wait for the app to mount in order for the svg to be available to d3
        this.graph = new AnalogyGraph();
        this.graphMounted = true;
    }
});