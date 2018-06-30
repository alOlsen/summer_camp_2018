/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        //this.receivedEvent('deviceready');

        var config = {
            type: Phaser.WEBGL,
            parent: "game",
            width:800,
            height:480,
            scene :{
                preload : preload,
                create : create,
                update : update
            }
        };

        var game = new Phaser.Game( config );

        /**
         * [preload: This function is used to load the assets for our game]
         * @return {[void]} [Returns void]
         */
        function preload(){
            //load plane Asset
            this.load.atlas('sheet', 'img/tappyplane/Spritesheet/sheet.png', 'img/tappyplane/Spritesheet/sheet.json');
        }

        /**
         * [create: places assets on the screen]
         * @return {[void]} [Returns void]
         */
        function create(){
            //Resize game to screen size
            window.addEventListener('resize', resize);
            resize();

            //add Sky
            //this.add.image(0,0, 'sheet', 'background.png').setOrigin(0); // if static
            this.bg = this.add.tileSprite(0,0,800,400,'sheet', 'background.png').setOrigin(0); // if infinite scroll

            //add plane
            this.add.sprite(400,300,'sheet','planeBlue1.png');

            //Add propeller motion animation
            this.anims.create({
                key: 'plane',
                repeat: -1,
                frameRate: 10,
                frames: this.anims.generateFrameNames('sheet', {start:1, end:3, prefix:'planeBlue', suffix:'.png'})
            });

            //add Plane to display list
            var plane = this.add.sprite( 400, 300, 'sheet').play('plane');

        }

        /**
         * [update is the main game loop]
         * @return {[void]} [Returns void]
         */
        function update(){
            //produce infinite scrolling for background
            this.bg.tilePositionX += 5;

        }   

        /**
         * [resize Resizes canvas object to screen size]
         * @return {[void]} [Returns void]
         */
        function resize(){
            var canvas  = game.canvas;
            var width   = window.innerWidth;
            var height  = window.innerHeight;
            var wratio  = width / height;
            var ratio   = canvas.width / canvas.height;

            if( wratio < ratio ){
                canvas.style.width  = width + 'px';
                canvas.style.height = height + 'px'; 
            }else{
                canvas.style.width  = (height * ratio ) + "px";
                canvas.style.height = height + "px";
            }

        }


    }
};

app.initialize();