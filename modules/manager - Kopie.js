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
		for (var j = 0; j < gcount; j++) {//Vorrunde generieren
			this.groups.push({ "name": LETTERS[j], "teams": [] });
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
			var game =
				{
					Team1: this.groups[i].teams[j],
					Team2: this.groups[i].teams[k],
					Points: [0, 0],
					finished: false,
					started: false
				}
			//Pushe auf Layer 0
			this.games[0].push(game);
		}
	}
}
		
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
				started: false
			}
		this.games[this.currentLayer + 1].push(game);

	}
	this.currentLayer++;
	return true;
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