//Creating a new vue application
var app = new Vue({
    el: '.app',
    data: {
        //Instantiate graph as null
        graph: '',
        graphMounted: false,
        selecting: false,
        colorPool: new ColorPool(),
        //We are binding this to our data sets selection dropdown
        currentlySelected: 'music',
        nodeLabels: [
            {
                name: 'placeholder',
                styles: {
                    display: 'none',
                    top: 0,
                    left: 0,
                    
                }
            },
            {
                name: 'placeholder',
                styles: {
                    display: 'none',
                    top: 0,
                    left: 0,
                    
                }
            },
        ],
        //Stores the data sets that are already currently in the graph
        dataSetsUsed: [],
        //An object that holds all of the relevant info for our current data sets
        dataSetsAvailable: [
            {
                name: 'Music',
                val: 'music',
                color: ''
            },
            {
                name: 'NFL',
                val: 'nfl',
                color: ''
            },
            {
                name: 'Oil',
                val: 'oil',
                color: ''
            },
            {
                name: 'Roman Empire',
                val: 'romanEmpire1000',
                color: ''
            },
            {
                name: 'Tech',
                val: 'techdata',
                color: ''
            },
            {
                name: 'World War II',
                val: 'ww2',
                color: ''
            },
            {
                name: 'Chinese Companies',
                val: 'chinese_company',
                color: ''
            },
            {
                name: 'US Companies',
                val: 'us_company',
                color: ''
            }
        ],

    },
    methods: {
        //This adds data sets to our graph using analogy graph
        addDataSet: function() {
            var tag = this.currentlySelected;
            var color = this.colorPool.getColor(tag);
            //Tell our graph to load a new data set
            this.graph.loadDataSet('js/data/' + tag + '.xml', tag, color);

            this.selecting = false;
            for (var i = 0; i < this.dataSetsAvailable.length; i++) {
                if (tag === this.dataSetsAvailable[i].val) {
                    this.dataSetsAvailable[i].color = color;
                    this.dataSetsUsed.push(this.dataSetsAvailable[i]);
                    this.dataSetsAvailable.splice(i, 1);
                    break;
                }
            }
        },
        generateAnalogy: function() {
            this.graph.getAnalogyLinks();
        }
    },
    mounted: function() {
        //We are instantiating our Analogy Graph here because we need to wait for the app to mount in order for the svg to be available to d3
        this.graph = new AnalogyGraph(this.nodeLabels);
        this.graphMounted = true;

        //This is used to create the graph automatically so we don't have to pick our own selection everytime
        this.currentlySelected = "music"
        this.addDataSet();
        this.currentlySelected = "romanEmpire1000"
        this.addDataSet();
    }
});