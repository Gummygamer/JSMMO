var ConsoleLib = require("../consolelib");
var Player = require('./objects/player');
var NConsole = new ConsoleLib();
var sqlite3 = require("sqlite3").verbose();
var FileSystem = require("fs");
var db = "";

var Database = function() {
	
};

Database.prototype = {
	open: function(file) {
		var status = "";
		var exists = FileSystem.existsSync(file);

		if(!exists) {
			NConsole.writeLine("Creating Database...");
			FileSystem.openSync(file, "w");
		} else {
			NConsole.writeLine("Opening Database...");
		}

		db = new sqlite3.Database(file);

		db.serialize(function() {
			if(!exists) {
				NConsole.writeLine("Creating table...");
				db.run("CREATE TABLE Players (Username TEXT, Password TEXT, Access INT, Sprite TEXT, Map TEXT, Health INT, Mana INT, x INT, y INT, dir INT)");
			}
		});
	},
	close: function() {
		if(typeof db != "string") {
			NConsole.writeLine("Closed Database.");
			db.close();
			db = "";
		}
	},
	// Players
	loginCorrect: function(Username, Password, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var userLoginCorrect = false;
				db.each("SELECT * FROM Players", function(err, row) {
					if(row.Username == Username && row.Password == Password && !userLoginCorrect) {
						userLoginCorrect = true
						return
					}
				}, function(err, cntx) {
					callback(userLoginCorrect);
				});
			});
		}
	},
	// Returns False! Fix something else
	isNew: function(Username, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var isplayernew = true;
				db.each("SELECT * FROM Players", function(err, row) {
					if(row.Username == Username && isplayernew) {
						isplayernew = false;
						return;
					}
				}, function(err, cntx) {
					callback(isplayernew);
				});
			});
		}
	},
	loadPlayer: function(Username, Password, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var player = new Player();
				db.each("SELECT * FROM Players", function(err, row) {
					if(row.Username == Username && row.Password == Password) {
						player.isLoged = true;
						player.Username = row.Username;
						player.Password = row.Password;
						player.Access = row.Access;
						player.Sprite = row.Sprite;
						player.Map = row.Map;
						player.Vittles.health = row.Health;
						player.Vittles.mana = row.Mana;
						player.Position.x = row.x;
						player.Position.y = row.y;
						player.Position.dir = row.dir;
					}
				}, function(err, cntx) {
					callback(player)
				});
				
			});
		}
	},
	savePlayer: function(player) {
		var self = this;
		this.isNew(player.Username, function(userIsNew) {
			if(userIsNew) {
				self.newPlayer(player);
			} else {
				db.serialize(function() {
					db.run("UPDATE Players SET Access = " + player.Access + ", Sprite = '" + player.Sprite + "', Map = '" + player.Map + "', Health = " + player.Vittles.health + ", Mana = " + player.Vittles.mana + ", x = " + player.Position.x + ", y = " + player.Position.y + ", dir = " + player.Position.dir + " WHERE Username = '" + player.Username + "'");
				});
			}
		});
	},
	newPlayer: function(player) {
		db.serialize(function() {
			db.run("INSERT INTO Players (Username, Password, Access, Sprite, Map, Health, Mana, x, y, dir) VALUES ('" + player.Username + "', '" + player.Password + "', " + player.Access + ", '" + player.Sprite + "', '" + player.Map + "', " + player.Vittles.health + ", " + player.Vittles.mana + ", " + player.Position.x + ", " + player.Position.y + ", " + player.Position.dir + ")");
		});
	}
}

module.exports = Database;