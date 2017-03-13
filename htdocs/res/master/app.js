var app = angular.module("masterApp",[]);

app.controller("mainCtrl",function($scope,$http){
    $scope.key = "";
    $scope.config = {};
    $scope.activeRefereeTab={};
    $scope.activeCompetitionsTab={};

    $scope.onload = function()
    {
        var regexP = /<!--#(\w+)#-->/g;
        $scope.key = regexP.exec(document.documentElement.outerHTML)[1];

        $http({method:"GET",url:"/api/master/"+$scope.key+"/data"}).then(function(res){
            $scope.config = res.data;
            $scope.initSocket(res.data.socketSecret);
            $scope.activeRefereeTab=$scope.config.referees[0];
            $scope.activeCompetitionsTab=$scope.config.competitions[0];
        },function(err){
            alert("Fataler Fehler beim abrufen der Daten!\n"+err);
        });
    };

    $scope.initSocket = function(ss)
    {
        $scope.socket = io();

        $scope.socket.on("authConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Auth Confirmed. Socket active");
                
            }
            else{
                alert("Konnte nicht Authentifizieren!\nDieser Versuch wird gemeldet!");
            }
        });
        $scope.socket.on("competitionLayerConfirm",function(msg){
            var data = JSON.tryParse(msg);
            if(data.status=="OK"){
                console.log("Layer Ended");
                location.reload();
            }
            else{
                alert("Konnte Ebene nicht beenden!");
            }
        });

        $scope.socket.emit("auth",JSON.stringify({
            "type":"master",
            "secret":ss
        }));
    };

    $scope.getTeamGroup = function(tid)
    {
        if($scope.activeCompetitionsTab.layer.layer==0){
            return $scope.activeCompetitionsTab.groups.find(function(g){return g.teams.find(function(t){return t.id==tid;});});
        }
        else{
            return "";
        }
    };

    $scope.setActiveTab = function(t)
    {
        $scope.activeRefereeTab = t;
    };
    $scope.setActiveTab2 = function(t)
    {
        $scope.activeCompetitionsTab = t;
    };

    $scope.gamesToPlayLeft = function()
    {
        if($scope.activeCompetitionsTab.games)return $scope.activeCompetitionsTab.games.find(function(g){return g.finished==false;});
    };

    $scope.endRound =function()
    {
        if(!$scope.gamesToPlayLeft()){
            console.log(JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
            $scope.socket.emit("endRound",JSON.stringify({competition:$scope.config.competitions.indexOf($scope.activeCompetitionsTab)}));
        }
    };

    $scope.getNewGameForReferee = function()
    {
        $scope.emit("pickNewGame",JSON.stringify($scope.config.referees.indexOf($scope.activeRefereeTab)));
    };

    $scope.gameStateFilter = function(state){
        return function(item){
            return state=="inprog"&&item.started==false&&item.finished==false||state=="queued"&&item.started==true&&item.finished==false;
        };
    };

    //Start Controller
    $scope.onload();

});

JSON.tryParse = function(str){
    try{
        return JSON.parse(str);
    }
    catch(ex){
        alert("FATALER PARSE ERROR!\n"+ex);
        return {};
    }
};