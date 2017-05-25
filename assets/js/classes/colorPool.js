var ColorPool = function() {
    this.availableColors = [
        '#ACBEC7',
        '#8EB496',
        '#C46A71',
        '#F3E37C',
        '#FFA151',
    ];

    this.usedColors = [];

    this.getColor = function(tag) {
        var color;
        if(this.availableColors.length > 0) {
            var color = this.availableColors[0];
            this.availableColors.splice(0, 1);
            this.usedColors.push({tag: tag, color: color});
            console.log(this.usedColors);
            return color;
        }
    };

    this.getUsedColor = function(tag) {
        console.log('getting used color');
        for (var i = 0; i < this.usedColors.length; i++) {
            console.log(this.usedColors[i].tag);
            // if (this.usedColors[i].tag === tag) {
            //     return this.usedColors[i].color;
            // }
        }
        return 'black'
    }
}