var app = angular.module("masterApp",[]);

app.controller("mainCtrl",function($scope,$http){
    $scope.key = "";
    $scope.config = {};
    $scope.activeTab={};

    $scope.onload = function()
    {
        var regexP = /<!--#(\w+)#-->/g;
        $scope.key = regexP.exec(document.documentElement.outerHTML)[1];

        $http({method:"GET",url:"/api/master/"+$scope.key+"/data"}).then(function(res){
            $scope.config = res.data.config;
            $scope.initSocket(res.data.socketSecret);
            $scope.activeRefereeTab=$scope.config.referees[0];
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

        $scope.socket.emit("auth",JSON.stringify({
            "type":"master",
            "secret":ss
        }));
    };

    $scope.setActiveTab = function(t)
    {
        $scope.activeRefereeTab = t;
    };

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