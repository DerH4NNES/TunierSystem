class storageController{
	constructor(JSONInput){
		this.JSONObject 	= JSON.parse(JSONInput);
		this.currentLayer	= 0;
		
	}
	
	
	//Zurückgeben aller existierenden Teams
	get getTeams(){
	
	}
	
	//Zurückgeben aller verbleibenden Teams
	get getRemainingTeams(){
	
	}
	
	//Gibt verbleibende Zeit zurück
	get RemainingTime(gameID){
		
	}
	
	
	get settings(){
		return JSON.stringify(JSONObject);
	}		
	
	//Tut nächstes Spiel laden tun.
	get nextGame(){
	
	}	
	
	//Runde beenden
	gameFinished(){
		
	}
	
	//Punkt für Team x in Spiel x auf der aktuellen Ebene
	gamePoint(gameID,teamID){
	
	}
	
	//Punkt abziehen in Team x in Spiel x auf der aktuellen Ebene
	gameRemovePoint(gameID,teamID){
	
	}
	
	//Auf in die nächste Spiel Ebene gehen tun.
	get gameStartNextLayer(){
		//check
		
		//true
		this.currentLayer++;
		return this.currentLayer
		
		//false
		return 0;
	}
	
	
} 