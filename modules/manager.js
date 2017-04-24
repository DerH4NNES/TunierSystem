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
	
	Sascha Hannes 2017(c)
*/

const md5 = require("md5");

class storageController {
	constructor(JSONInput,dumpData) {
		if(JSONInput==null){return this.doImportDump(dumpData);}
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
		}
		for (var j = 0; j < gcount; j++) {//Vorrunde generieren
			for (var k = 0; k < tc / gcount; k++) {
				this.groups[j].teams[k] = this.JSONObject.teams[j*(tc/gcount)+k];
				this.groups[j].teams[k].points = 0;
			}
		}
	
		for(var i = 0; i < this.groups.length; i++){//Vorrundenspiele generieren	
			for (var j = 0; j < this.groups[i].teams.length; j++) {//Jedes Team bekommt einen durchlauf für alle Gegner. Bei letztem Durchlauf sind alle teams gesetzt
				for (var k = j; k < this.groups[i].teams.length; k++) {//Jedes Spiel wird generiert.
					if(j==k){continue;}
					var game =
						{
							Team1: this.groups[i].teams[j],
							Team2: this.groups[i].teams[k],
							Points: [0, 0],
							finished: false,
							started: false,
							timestamp: 0,
							id:this.getRandomMD5,
							layer:0,
							blocked:false
						};
//console.log(game);
					//Pushe auf Layer 0
					this.games[0].push(game);
				}
			}
		}	
		var tempgames = [];
		var count=0;
		var offset1 = 0;
		var offset2 = this.games[0].length/gcount;
		
		for(var j=0;j<this.groups.length;j++){
			for(var i=0;i<offset2;i++){
				
				tempgames[i*offset2 + offset1] = this.games[0][count];
				count++;
				
			}
			offset1++;
		}
		tempgames = tempgames.filter(function(n){ return n != undefined }); 
		console.log(tempgames);
		
		this.games[0] = tempgames;
		//console.log(this.group
	}

	doImportDump(dumpData)
	{
		console.log(dumpData);
		console.log("###");
		console.log(dumpData.groups[2].teams[0]);
		console.log("###");
		console.log(dumpData.groups[0].teams[0].name="XYZ");
		console.log(dumpData.JSONObject.teams);
		for(var key in dumpData){
			this[key] = dumpData[key];
		}
	}

	startGame(gameID){
		var game = this.games[this.currentLayer].find((g)=>{return g.id==gameID;});
		if(!game.finished){
			var ts = Date.now();
			game.timestamp = ts;
			game.started = true;
			return true;
		}
		return true;
	}
	
	get getRandomMD5()
	{
		return md5(Date.now()+Math.random());
	}

	finishLayer(currentLayer){
		if (!this.LayerFree) {
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
					layer:this.currentLayer+1,
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
		return this.games[this.currentLayer].filter((t)=>{return t.finished==false&&t.started==false;});
	}
	get getRemainingGamesNonBlocked(){
		console.log(this.games);
		return this.games[this.currentLayer].filter((t,ind)=>{return t.finished==false&&t.started==false&&t.blocked==false;});
	}
	
	get getRandomRemainingGame()
	{
		var rg = this.getRemainingGamesNonBlocked;
		if(rg.length==0)return null;
		console.log(rg);
		var g = rg[0];
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
		this.games[this.currentLayer].find((g)=>{return g.id==gameID;}).Points[teamID]++;
	}
	
	//Punkt abziehen in Team x in Spiel x auf der aktuellen Ebene
	gameRemovePoint(gameID, teamID){
		this.games[this.currentLayer].find((g)=>{return g.id==gameID;}).Points[teamID]--;
	}	
} 

module.exports = storageController;