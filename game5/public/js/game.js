/*For this tutorial, we will store the player data in memory on the server. 
Normally, we would want to store this data in some type of database, 
that way it would be persistent, and if the server fails, 
we could easily recover the state of the game.*/

var config 	= {
	type: Phaser.AUTO,
	parent: 'phaser-example',
	width : 800,
	height : 600,
	physics : {
		default : 'arcade',
		arcade: {
			debug : false,
			gravity : { y : 0 }
		}
	},
	scene : {
		preload : preload,
		create 	: create,
		update 	: update
	}
};

var game = new Phaser.Game( config );

/**
 * [preload: This function is used to load the assets for our game]
 * @return {[void]} [Returns void]
 */
function preload(){
	//load the spaceship graphic and call it 'ship'
	this.load.image('ship', 'assets/spaceShip.png');

	//Load enemy ship assets
	this.load.image('otherPlayer', 'assets/enemyBlack.png');

	//Load star asset
	this.load.image('star', 'assets/star.png');
}

 /**
 * [create: places assets on the screen]
 * @return {[void]} [Returns void]
 */
function create(){

//PLAYERS
	//a way to call the current instance of this class/object that is running the program
	var self = this;
	//other players group
	this.otherPlayers = this.physics.add.group();

//SCORES UI
	//create two text objects with style and positions set below
	this.blueScoreText = this.add.text( 16, 16,'', {fontSize: '32px', fill: '#0000FF' });
	this.redScoreText = this.add.text( 584, 16,'', {fontSize: '32px', fill: '#FF0000' });


//NETWORK EVENTS

	//Add socketIO to game
	this.socket = io();

	//Fire this functions when the 'currentPlayers' event is broadcasted by the server'
	this.socket.on('currentPlayers', function( players ){

		//loop through every key in the players object for each player send the player id to a function
		Object.keys(players).forEach( function(id){
			// match the player socket id in the event with the socked id of the current class/object
			if(players[id].playerId === self.socket.id ){
				//add new player to the players list object
				addPlayer( self, players[id] );
			}else{
				addOtherPlayers( self, players[id]);
			}

		});
	});

	//Fire this function when the 'newPlayer' event is broadcasted by the server
	this.socket.on('newPlayer', function( playerInfo ){
		//run function to add other players
		addOtherPlayers( self, playerInfo );
	});
	
	//Fire this function when a player moves and update everyone's view
	this.socket.on('playerMoved', function( playerInfo ){
		self.otherPlayers.getChildren().forEach( function( otherPlayer ){
			if( playerInfo.playerId === otherPlayer.playerId ){
				otherPlayer.setRotation( playerInfo.rotation );
				otherPlayer.setPosition( playerInfo.y );
			}
		});
	});

	//Fire this function when the score updates
	this.socket.on('scoreUpdate', function(scores){
		self.blueScoreText.setText('Blue: '+ scores.blue );
		self.redScoreText.setText('Red: '+scores.red );
	});

	this.socket.on('starLocation', function(starLocation) {
		
		//check if star exists to destroy it
		//if(self.star) self.star.destroy();

		//add star GAME OBJECT to the player's game using properties from starLocation issued by server
		//self.star 		= self.physics.add.image(starLocation.x, starLocation.y, 'star');

		
		  if (self.star) self.star.destroy();
		  self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
		  self.physics.add.overlap(self.ship, self.star, function () {
		    this.socket.emit('starCollected');
		  }, null, self);


	});

	//Fire this function when the 'disconnect' event is broadcasted by the server
	this.socket.on('disconnect', function( playerId ){
		//Loop through all elements in the otherPlayers list and for each run a function
		self.otherPlayers.getChildren().forEach( function( otherPlayer ){
			//check if the player that got disconnected is in the list
			if( playerId === otherPlayer.playerId){
				//destroy if the disconnected otherPlayer is found in the list and remove it
				otherPlayer.destroy();
			}
		});
	});

//EVENTS LISTENERS


	this.cursors = this.input.keyboard.createCursorKeys();

}


/**
 * [update is the main game loop]
 * @return {[void]} [Returns void]
 */
function update(){

//NAVIGATION/MOVE MECHANICS
	
	if(this.ship){

		if(this.cursors.left.isDown){
			this.ship.setAngularVelocity(-150);
		}else if( this.cursors.right.isDown){
			this.ship.setAngularVelocity(150);
		}else{
			this.ship.setAngularVelocity(0);
		}

		if( this.cursors.up.isDown ){
			this.physics.velocityFromRotation( this.ship.rotation + 1.5, 100, this.ship.body.acceleration );
		}else{
			this.ship.setAcceleration(0);
		}

		//If ships goes off screen, ship appears on the other side of the screen
		this.physics.world.wrap( this.ship, 5 );


		//UPDATE ALL PLAYERS WITH PLAYER MOVEMENT
		var x = this.ship.x;
		var y = this.ship.y;
		var r = this.ship.rotation;

		//Compare the previous position with current position, if change then emit even 'playerMovement' caught in the server
		if( this.ship.oldPosition && ( x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y ) ){

			this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
		}

		//Save old position data in Memory ( not recommended , consider adding a database to keep track of all states )
		this.ship.oldPosition = {
			x: this.ship.x,
			y: this.ship.y,
			rotation : this.ship.rotation
		}
	}	
}

/**
 * [addPlayer adds a player and sets its properties based on server definitions]
 * @param {[object]} self       [reference to the a player in the players list]
 * @param {[object]} playerInfo [information created when player 1 connects to game]
 */
function addPlayer( self, playerInfo ){

	//created our player's ship, using its properties and making it a physics body
	self.ship = self.physics.add.image( playerInfo.x, playerInfo.y, 'ship' ).setOrigin( 0.5, 0.5 ).setDisplaySize( 53, 40 );

	// add the color to our sprite depending on the playerInfo team value
	if(playerInfo.team === 'blue'){
		self.ship.setTint(0x0000ff);
	}else{
		self.ship.setTint(0xff0000);
	}

	//add physics for resistance
	self.ship.setDrag( 100 );
	self.ship.setAngularDrag( 100 );
	// sets the speed limit of the object
	self.ship.setMaxVelocity( 200 );
}

/**
 * [addOtherPlayers adds other player and sets its properties based on server definitions]
 * @param {[type]} self       [description]
 * @param {[type]} playerInfo [description]
 */
function addOtherPlayers( self, playerInfo ){
	//adds otherPlayer object with playerInfo
	const otherPlayer = self.add.sprite( playerInfo.x, playerInfo.y, 'otherPlayer' ).setOrigin( 0.5, 0.5 ).setDisplaySize( 53, 40 );
	//checks and tints the team color
	if(playerInfo.team === 'blue'){
		otherPlayer.setTint(0x0000ff);
	}else{
		otherPlayer.setTint(0xff0000);
	}
	//assign the id to the other player assigned by server
	otherPlayer.playerId = playerInfo.playerId;
	//add otherPlayer to the otherPlayers list
	self.otherPlayers.add(otherPlayer);

}


function collectStar( ){
	console.warn(['starLocation2',self.ship, self.star, this.socket])
	this.socket.emit('starCollected');
}