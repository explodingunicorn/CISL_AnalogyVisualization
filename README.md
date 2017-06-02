# Analogy Visualization

This is a repository for CISL's analogy visualization. It visualizes data created by the analogy engine.

# Requirements

### Node.js -Latest Version

### Python 3
* PIP for installation of packages
* Packages
  * Flask

# Getting Started

Getting started is easy. Install the necessary requirements avoe, clone this repo, navigate to the folder in your terminal, and run the commands below:

(Please note this version requires Mac OSX or Linux to run at the moment)
```
npm install
npm start
```

# Project structure

This project is broken into 3 main sections: The Node.js Server, the static assets, and the analogy server (python). 

The code for the Node.js server resides in the main project directory in server.js. We are using express to start up the server and serve the static files. This project also live-reloads. This means anytime a file is saved in our static assets directory the browser window will reload automatically. 

The code for our static assets resides in the assets folder. This contains all of the frontend code of the project including the graph itself: 

```
assets
--js
----analogyGraph.js
```

The static assets also contain all of the xml files which contains our data. The data must reside here because the frontend needs the data inside of the static files in order to function. You will find the data files under the 'js' folder.

The code for the analogy server is under the analogyServer folder. All it contains is two python scripts. One of which starts the python server, the other is the analogy engine.

To be continued...
