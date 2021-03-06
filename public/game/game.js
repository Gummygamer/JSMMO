window.GameEngine = function() {
	this.Canvas = document.getElementById('gameCanvas'); this.Canvas.width = window.innerWidth; this.Canvas.height = window.innerHeight;

	this.gameWidth = window.innerWidth;
	this.gameheight = window.innerHeight;

	this.gameLock = "";
	this.gameOffsetX = 0;
	this.gameOffsetY = 0;

	this.Canvas.addEventListener("keydown", onKeyDown, false);
	this.Canvas.addEventListener("keyup", onKeyUp, false);

	this.NetVar = {
		netMessage: "",
		myIndex: "",
		myID: 0,
		isOnline: false,
		Players: {} // Needs something in there..
	};

	this.GUI = {
		parent: this,
		miniButtonToggle: true,
		hide: function(obj) {
			$("#" + obj).hide();
		},
		show: function(obj) {
			$("#" + obj).show();
		},
		toggle: function(obj) {
			$("#" + obj).toggle();
		},
		//
		miniButtonClick: function() {
			if(this.miniButtonToggle) {
				$("#miniButton").text("-");
				$("#chatLog").animate({ "height": 0}, 1000, function(){
				  $(this).css('height',0);
				});
			} else {
				$("#miniButton").text("+");
				$("#chatLog").animate({ "height": 200}, 1000, function(){
				  $(this).css('height',200);
				});
			}

			this.miniButtonToggle = !this.miniButtonToggle;
		}
	};

	this.Movement = {
		parent: this,
		dir: 4,
		Process: function() {
			if(window.PressedKeys.length > 1) {
				switch(window.PressedKeys[1]) {
					case 83:
						this.dir = 0;
						break;
					case 65:
						this.dir = 1;
						break;
					case 68:
						this.dir = 2;
						break;
					case 87:
					 	this.dir = 3;
						break;
				}
			}
			if(this.dir < 4) { 
				Socket.emit("onMovement", this.dir);
			}
		},

		getDistance: function(x, y) {
			var myX = 0;
			var myY = 0;
			for(var obj in this.parent.NetVar.Players) {
				var player = this.parent.NetVar.Players[obj];
				if(player.ID == this.parent.NetVar.myIndex) {
					myX = player.Position.x;
					myY = player.Position.y;
					break;
				}
			}
			
			var object = {}
			object.distX = myX - x;
			object.distY = myY - y;

			return object;
		}
	};

	this.Render = {
		parent: this,
		ctx: this.Canvas.getContext('2d'),
		fps: 0,
		draw: function() {
			this.parent.Canvas.width = window.innerWidth;
            this.parent.Canvas.height = window.innerHeight;
			this.ctx.clearRect(0, 0, this.parent.Canvas.width, this.parent.Canvas.height);
			this.ctx.save();
			// Start Draw objects here
			this.parent.DrawnObject.drawTile(this.ctx);
			this.parent.DrawnObject.drawPlayers(this.ctx);
			this.parent.DrawnObject.drawFPS(this.ctx, this.fps);
			if(this.parent.NetVar.netMessage.length > 0) { this.parent.DrawnObject.drawNetMessage(this.ctx) };
			// End Draw Objects Here
			this.ctx.restore();
			this.fps = this.parent.FPS.getFPS();
		}
	};

	// this.Text = this.RenderObjects.textObject()
	this.DrawnObject = {
		parent: this,
		netMessageToggle: false,
		// Text
		drawTile: function(ctx) {
			var wh = 500;

			var drawX = window.innerWidth/2;
			var drawY = window.innerHeight/2;

			var dist = this.parent.Movement.getDistance(0, 0);
			drawX -= dist.distX;
			drawY -= dist.distY;

			ctx.fillStyle="#FF0000";
			ctx.fillRect(drawX,drawY,wh,wh);
		},
		drawText: function(ctx, text, x, y, color) {
			color = typeof color !== 'undefined' ? color : "black";
			ctx.fillStyle = color;
			ctx.font = "16px serif";
			ctx.fillText(text, x, y);
		},
		drawLargeText: function(ctx, text, x, y) {
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "25px 'BIMINI'";
			ctx.fillText(text, x, y);
		},
		drawChatText: function(ctx, text, x, y) {
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "15px 'BIMINI'";
			ctx.fillText(text, x, y);
		},
		drawNameText: function(ctx, text, color, x, y) {
			ctx.fillStyle = color;
			ctx.font = "15px 'BIMINI'";
			ctx.textAlign = "center";
			ctx.fillText(text, x, y);
		},
		// Objects
		drawFPS: function(ctx, fps) {
			var color = "green";
			if(fps < 20) { 
				color = "yellow";
			} else if(fps < 10) {
				color = "red";
			}
  			this.drawText(ctx, "FPS: " + fps, 30, 15, color);
		},
		drawSprite : function(ctx, sprite, x, y, d, f) {
			// Sprite Size = 96
			// Todo auto sprite size
			var h = 96;
			var w = 96;

			var frameY = d*h;
			var frameX = f*w;
			var posX = x-49;
			var posY = y-49;

			ctx.drawImage(Cache.getImage("img/sprite/" + sprite + ".png"), frameX, frameY, w, h, posX, posY, w, h);
		},
		drawPlayers: function(ctx) {
			for(var obj in this.parent.NetVar.Players) {
				var player = this.parent.NetVar.Players[obj];
				

				var drawX = window.innerWidth/2;
				var drawY = window.innerHeight/2;
				if(player.ID == this.parent.NetVar.myIndex) {
					// Nothing
				} else {
					var dist = this.parent.Movement.getDistance(player.Position.x, player.Position.y);
					drawX -= dist.distX;
					drawY -= dist.distY;
				}

				this.drawNameText(ctx, player.Username, "#000", drawX, drawY-49);
				this.drawSprite(ctx, player.Sprite, drawX, drawY, player.Position.dir, player.Position.ani)
			}
		},
		drawNetMessage: function(ctx) {
			this.netMessageToggle += 1;
			
			if (this.netMessageToggle >= 15) {
				color = "green";
			} else {
				color = "red";
			}

			if (this.netMessageToggle >= 30) { this.netMessageToggle = 0; }
			this.drawText(ctx, this.parent.NetVar.netMessage, this.parent.gameWidth/2, 15, color);
		}
	}

	this.GameLoop = {
		parent: this,
		shouldSendStop: false,
		update: function() {
			var self = this;
			
			setTimeout(function() {
	        	requestAnimationFrame(function() {self.update()})
				
	 			self.parent.Render.draw();
    		}, 1000/60);
		}
	};

	this.FPS = {
		parent: this,
		startTime : 0,
		frameNumber : 0,
		getFPS : function(){
			this.frameNumber++;
			var d = new Date().getTime(),
				currentTime = ( d - this.startTime ) / 1000,
				result = Math.floor( ( this.frameNumber / currentTime ) );

			if( currentTime > 1 ){
				this.startTime = new Date().getTime();
				this.frameNumber = 0;
			}
			return result;
		}	
	};

	this.Network = {
		parent: this,
		onConnect: function(index) {
			this.parent.NetVar.myIndex = index;
		},
		onLogin: function() {
			this.parent.NetVar.isOnline = true;
			this.parent.GUI.hide("loginGUI");
			this.parent.GUI.show("gameGUI");

			this.parent.GameLoop.update(); // -> Start Game Loop & Drawing
		}
	}
};

GameEngine.prototype = {
	
};


function contains(array, obj) {
    if(jQuery.inArray(obj, array) > 0) return true
    return false;
}

function del(array, obj) {
	return jQuery.grep(array, function(value) { return value != obj; })
}

var Dir = -1;
var isMoving = false;
var heldKey = 0;
function onKeyDown(event) {
	var self = this;
	var code = event.keyCode || event.which;

	console.log("Pressed Key: ", code);


	switch(code) {
		case 83:
			if(!isMoving) Dir = 0;
			break;
		case 68:
			if(!isMoving) Dir = 2;
			break;
		case 87:
		 	if(!isMoving) Dir = 3;
			break;
		case 65:
			if(!isMoving) Dir = 1;
			break;
	}

	if(code == 83 || code == 68 || code == 87 || code == 65) {
		if(!isMoving) {
			heldKey = code;
			Network.sendStartMovement(Dir);
			isMoving = true;
		}
	}
}

function onKeyUp(event) {
	var self = this;
	var code = event.keyCode || event.which;

	console.log("Released Key: ", code);

	// Movement Keys
	if(code == 83 || code == 68 || code == 87 || code == 65) {
		if(isMoving && heldKey == code) {
			Network.sendStopMovement(true);
			isMoving = false;
		}
	}
}

/*function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var cars = text.split("\n");

        for (var ii = 0; ii < cars.length; ii++) {

            var line = "";
            var words = cars[ii].split(" ");

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " ";
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;

                if (testWidth > maxWidth) {
                    context.fillText(line, x, y);
                    line = words[n] + " ";
                    y += lineHeight;
            } else {
            	line = testLine;
        	}
        }
		context.fillText(line, x, y);
		y += lineHeight;
	}
}*/