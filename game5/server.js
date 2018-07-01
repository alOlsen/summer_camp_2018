//Reference the Express module used as a web framework to render static files
var express = require("express");
//Create instance of the Express Object
var app 	= express();
//Send app to the HTTP server to allow express to handle HTTP requests
var server 	= require('http').Server(app);
//Add socket.io module for bi-directional communication between client and server
var io 		= require('socket.io').listen(server);
//Connected players roster
var players = {};
//Star Pickups list
var star = {
	x: Math.floor(Math.random() * 700) + 50,
	y: Math.floor(Math.random() * 500) + 50
};
//Score 
var scores = {
	blue: 0,
	red: 0
};

//Update server to render static files
app.use( express.static(__dirname + '/public') );

//Use index.html as default file for homepage
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

//Adding a user connection listener. It detects when new player connect or disconnect from game network
io.on('connection', function(socket){
	console.log('a user connected');

	//Create and add New player in players roster array
	players[socket.id] = {
		rotation 	: 0, // Initial rotation degree
		x 			: Math.floor(Math.random() * 700) + 50, // Initial X position picked at random
		y 			: Math.floor(Math.random() * 500) + 50, // Initiay Y position picked at 
		playerId 	: socket.id, // user ID given by socket.io
		team 		: (Math.floor(Math.random() * 2) == 0 )? 'red' : 'blue' // randomly pick a team color
	};

	// send the players object to the new player
	socket.emit('currentPlayers', players);

	//send the star object to the new player
	socket.emit( 'starLocation', star );

	//send the current scores
	socket.emit( 'scoreUpdate', scores );

	// update all other players of the new player
	socket.broadcast.emit('newPlayer', players[socket.id]);

	//Fires when a player moves, update the player data
	socket.on('playerMovement', function( movementData ){
		console.log("update position")
		players[socket.id].x 		= movementData.x;
		players[socket.id].y 		= movementData.y;
		players[socket.id].rotation = movementData.rotation;
		// emit a message to all players about the player that moved
		socket.broadcast.emit('playerMoved', players[socket.id]);
	});

	//Fires when a player collects a star
	socket.on('startCollected', function(){
		console.warn('star collected')
		//check which team and then add 10 points to their score
		if( players[socket.id].team === 'red' ){
			scores.red += 10;
		}else{
			scores.blue += 10;
		}	
		//pick a random location in the X axis
		star.x = Math.floor( Math.random() * 700 ) + 50;
		//pick a random location in the Y axis
		star.y = Math.floot( Math.random() * 500 ) + 50;
		//update UI and starLocation
		io.emit( 'starLocation', star );
		io.emit( 'scoreUpdate', scores );
	});

	// check if players disconnect
	socket.on('disconnect', function(){
		console.log('user disconnected');
		//delete the avatar of player that left
		delete players[socket.id];
		//let everyone know that the player got disconnected
		io.emit('disconnect', socket.id);

	});
});

//Start server in port 8081
server.listen(8081, function(){
	console.log(`Listening on ${server.address().port}`);
});



