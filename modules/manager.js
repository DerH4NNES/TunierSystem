/**
	** storageControler **

	constructor(JSONObject)
	startGame(GameID)
	finishLayer()
	RemainingTeams()
	getGroups()
	eleminatedTeams()
	getTeams()
	getSettings()
	finishGame()
	gamePoint(GameID,TeamID) 0|1
	gameRemovePoint(gameID,TeamID) 0|1
	MarcelDerHurensohn(Retard) 100-200 | in percent
	
	Sascha Hannes 2017(c)
*/

const md5 = require("md5");

class storageController {
	constructor(JSONInput) {
		this.JSONObject = JSONInput;
		this.currentLayer = 0;
		this.games = [];
		this.games.push([]);
		this.groups = [];
		var settingGsize = this.JSONObject.levels[0].teamGroupAmount;
		this.LayerFree = false;
		var settingFsize = this.JSONObject.levels[0].teamWinnerAmount;
		var tc = 0;
		var gcount = 0;
		var finalTeams = 0;
		var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
		tc = this.JSONObject.teams.length;
		this.finalteams = tc / (settingGsize / settingFsize);
		gcount = tc / settingGsize;
		this.JSONObject.teams.forEach(((t)=>{t.id=this.getRandomMD5;}).bind(this));
		for (var j = 0; j < gcount; j++) {//Vorrunde generieren
			this.groups.push({ "name": LETTERS[j], "teams": [], "id":this.getRandomMD5 });
			//Team shuffle
			for (let l = this.JSONObject.teams.length; l; l--) {
				let ll = Math.floor(Math.random() * l);
				[this.JSONObject.teams[l - 1], this.JSONObject.teams[ll]] = [this.JSONObject.teams[ll], this.JSONObject.teams[l - 1]];
			}
			for (var k = 0; k < tc / gcount; k++) {
				this.groups[j].teams[k] = this.JSONObject.teams[j + k];
				this.groups[j].teams[k].points = 0;
			}
		}
	
		for(var i = 0; i < this.groups.length; i++){//Vorrundenspiele generieren	
			for (var j = 0; j < this.groups[i].teams.length - 1; j++) {//Jedes Team bekommt einen durchlauf für alle Gegner. Bei letztem Durchlauf sind alle teams gesetzt
				for (var k = j; k < this.groups[i].teams.length - 1; k++) {//Jedes Spiel wird generiert.
					if(j==k)continue;
					var game =
						{
							Team1: this.groups[i].teams[j],
							Team2: this.groups[i].teams[k],
							Points: [0, 0],
							finished: false,
							started: false,
							timestamp: 0,
							id:this.getRandomMD5,
							layer:this.currentLayer,
							blocked:false
						};
					//Pushe auf Layer 0
					this.games[0].push(game);
				}
			}
		}	
	}
	startGame(gameID){
		if(!games[gameID].finished){
			var ts = Date.now();
			games[gameID].timestamp = ts;
			games[gameID].started = true;
			return true;
		}
		return true;
	}
	
	get getRandomMD5()
	{
		return md5(Date.now()+Math.random());
	}

	finishLayer(currentLayer){
		if (!LayerFree) {
			//Checke ob alle Spiele gespielt wurden
			for (var i = 0; i < this.games[this.currentLayer].length; i++) {
				if (!this.games[this.currentLayer][i].finished)
					return false;
			}
		}
		else {
			return false;
		}
		var nextLayerTeams = [];
		//Vorrunde oder K.O
		if (this.currentLayer == 0) {//Vorrunde

		}
		else {//K.0
			for (var i = 0; i < this.games[this.currentLayer].length; i++) {
				if (this.games[this.currentLayer].Points[0] > this.games[this.currentLayer].Points[1]) {
					nextLayerTeams.push(this.games[this.currentLayer].Team1);
				}
				else {
					nextLayerTeams.push(this.games[this.currentLayer].Team2);
				}
			}
		}

		for (var j = 0; j < this.nextLayerTeams; j += 2) {//Jedes Team bekommt einen durchlauf für alle Gegner. Bei letztem Durchlauf sind alle teams gesetzt
			var game =
				{
					Team1: nextLayerTeams[j],
					Team2: nextLayerTeams[j + 1],
					Points: [0, 0],
					finished: false,
					started: false,
					timestamp: 0,
					id:this.getRandomMD5,
					layer:this.currentLayer,
					blocked:false
				}
			this.games[this.currentLayer + 1].push(game);

		}
		this.currentLayer++;
		return nextLayerTeams;
	}
	get getRemainingTeams(){
		var et = [];
		for(var i;i<this.games.length;i++){
			if(this.games[i].finished){
				if(this.games[i].Points[0] < this.games[i].Points[1]){
					et.push(this.games[i].Team2);
				}
				else{
					et.push(this.games[i].Team1);
				}
			}
		}
		return et;
	}

	get getTurnierName(){
		return this.JSONObject.name;
	}
	get getGroups(){
		return this.groups;
	}

	get getTurnierLayerAmount()
	{
		var c=0;var ta = ((this.JSONObject.teams.length*(this.JSONObject.levels[0].teamWinnerAmount/this.JSONObject.levels[0].teamGroupAmount)));
		while(ta/2>1){c++;ta/=2;}
		return c;
	}

	get getCurrentLayer(){
		var tl = this.getTurnierLayerAmount;
		var roundNames = ["Vorrunde","16. Finale","8. Finale","4. Finale","halb Finale","Finale"];
		if(tl<5)roundNames.splice(roundNames.indexOf("16. Finale"),1);
		if(tl<4){roundNames.splice(roundNames.indexOf("8. Finale"),1);}
		if(tl<3){roundNames.splice(roundNames.indexOf("4. Finale"),1);}
		if(tl<2){roundNames.splice(roundNames.indexOf("halb Finale"),1);}
		return {"layer":this.currentLayer,"layerName":roundNames[this.currentLayer]};
	}
	get eleminatedTeams(){
		var et = [];
		for(var i;i<this.games.length;i++){
			if(this.games[i].finished){
				if(this.games[i].Points[0] > this.games[i].Points[1]){
					et.push(this.games[i].Team2);
				}
				else{
					et.push(this.games[i].Team1);
				}
			}
		}
		return et;
	}

	get getGamesThisLayer(){
		return this.games[this.currentLayer];
	}
	
	//Zurückgeben aller existierenden Teams
	get getTeams(){
		return this.JSONObject.teams;
	}

	get settings(){
		return JSON.stringify(this.JSONObject);
	}

	//Tut nächstes Spiel laden tun.
	get getGames(){
		return this.games;
	}

	get getRemainingGames(){
		return this.games.filter((t)=>{return t.finished==false&&t.started==false;});
	}
	get getRemainingGamesNonBlocked(){
		console.log(this.games);
		return this.games.filter((t)=>{return t.finished==false&&t.started==false&&t.blocked==false;});
	}

	get getRandomRemainingGame()
	{
		var rg = this.getRemainingGamesNonBlocked;
		console.log(rg);
		var g = rg[Math.floor(Math.random()*rg.length)];
		g.blocked=true;
		return g;
	}

	get getDoneGames(){
		return this.games.filter((t)=>{return t.finished==true&&t.started==true;});
	}
	
	get getRunningGames(){
		return this.games.filter((t)=>{return t.finished==false&&t.started==true;});
	}

	//Runde beenden
	finishGame(gameID){
		this.games[gameID].finished = true;
	}
	
	//Punkt für Team x in Spiel x auf der aktuellen Ebene
	gamePoint(gameID, teamID){
		this.games[gameID].Points[teamID]++;
	}
	
	//Punkt abziehen in Team x in Spiel x auf der aktuellen Ebene
	gameRemovePoint(gameID, teamID){
		this.games[gameID].Points[teamID]--;
	}	
} 

module.exports = storageController;