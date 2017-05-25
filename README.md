# Analogy Visualization

This is a repository for CISL's analogy visualization. It visualizes data created by the analogy engine. You will need to install Node.js, and Python 3 in order to run this project locally.

Getting started is easy. Clone this repo, navigate to the folder in your terminal, and run the commands below:

(Please note this version requires Mac OSX or Linux to run at the moment)
```
npm install
npm start
```

# Project structure

This project is broken into 3 main sections: The Node.js Server, the static assets, and the analogy server (python). 

The code for the Node.js server resides in the main project directory in main.js. We are using express to start up the server and serve the static files. This project also live-reloads. This means anytime a file is saved in our static assets directory the browser window will reload automatically. 

The code for our static assets resides in the assets folder. 

To be continued...
