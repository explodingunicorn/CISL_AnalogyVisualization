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
        ],

    },
    methods: {
        //This adds data sets to our graph using analogy graph
        addDataSet: function() {
            var tag = this.currentlySelected;
            this.graph.loadDataSet('js/data/' + tag + '.xml', tag);
            var newColor = this.graph.getColor(tag);
            this.selecting = false;
            for (var i = 0; i < this.dataSetsAvailable.length; i++) {
                if (tag === this.dataSetsAvailable[i].val) {
                    this.dataSetsAvailable[i].color = newColor;
                    this.dataSetsUsed.push(this.dataSetsAvailable[i]);
                    this.dataSetsAvailable.splice(i, 1);
                    break;
                }
            }
        },
        generateAnalogy: function() {
            this.graph.getAnalogyLinks();
        },
        sendTest: function() {
            $.ajax({
                url: '/',
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify({name: 'butts'}),
                complete: function() {

                },
                success: function(data) {
                    console.log('success!');
                },
                error: function() {
                    console.log('There was an error');
                }
            })
        }
    },
    mounted: function() {
        //We are instantiating our Analogy Graph here because we need to wait for the app to mount in order for the svg to be available to d3
        this.graph = new AnalogyGraph(this.nodeLabels);
        this.graphMounted = true;
    }
});