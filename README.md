# TunierSystem
Bei dem Projekt handelt es sich um ein Tuniersystem mit einer Anzeige.
Es besteht aus 4 wesentlichen Teilen.

#Anforderungen
Für den Server
 - Einen Server mit zwei freien freigeschalteten TCP Ports.
 
Für den Client
 - Webbrowser

#Spezifikationen
Es können n Clients verbinden und n Schiedsrichter existieren.
Es können n Tuniere parallel laufen und die Gruppen Anzahl muss mehr als drei Teams beinhalten.
Die Gruppen müssen mindestens drei Teams beinhalten, bis zu dem Punkt ab dem das K.O - System in Kraft tritt.
Es gibt einen Gamemaster und jeder Schiedsrichter muss ein eigenes Smartphone für die Verwaltung des Spiels besitzen.
Alle Geräte brauchen eine stabile Verbindung zum Internet.  

#Server
Es beinhaltet einen Server, welcher über zwei Ports mit dem Client und dem Gamemaster
kommuniziert. Über den einen können Daten über die Spiele abgerufen werden, über den anderen
werden Befehle gesendet, welche den Verlauf des Spiels bestimmen und die Struktur des Tuniers festlegen.

#Zuschauer-Client
Bei dem Client handelt es sich um eine WebApp.
Jene WebApp zeigt die aktuell laufenden Spiele, Spielstände und die folgenden Spiele
des Tuniers in einer "treeview" an.

#Schiedsrichter-Client
Ebenfalls eine WebApp, dem Schiedsrichter wird ein Passwort zugewiesen, die WebApp zeigt dem Schiedsrichter, welches Spiel er verwaltet,
ermöglicht das Geben von Punkten in einem selbst gestartem Spiel. Das Spiel kann gestartet werden, sobald der Gamemaster die Ebene im Baumdiagramm
freigeschaltet hat. Nach dem Start einer Runde läuft ein Countdown von der im System eingestellten Zeit runter und meldet die Schiedsrichter sobald die Runde vorbei ist.
Das Ende der Runde muss vom Schiedsrichter bestätigt werden. Spiele können ebenfalls pausiert werden.

#Gamemaster-Anwendung
Die Gamemaster-Anwendung ist im grunde genommen eine Erweiterung der Client und Schiedsrichter WebApp.
Mit der Gamemaster-Anwendung kann der Gamemaster jede neue Ebene im Baumdiagramm initialisieren und für die Schiedsrichter freigeben.
Des Weiteren, kann man mit dieser Anwendung das Kennwort für jeweilige Schiedsrichter anlegen und jeden Schiedsrichter einem
Spiel zuordnen. Mit dieser Anwendung können ebenfalls die Struktur des Spiels angepasst werden. 


#Spielablauf
Der Gamemaster muss das Spiel einrichten, danach kann er Die Vorrunde freigeben. Nach der Freigabe können die Schiedsrichter die Spiele starten.
Nach dem Ende aller Spiele dieser Ebene wird die Ebene "eingefroren". Darauf kann der Gamemaster die nächste Ebene freigeben.
Zum Ende des Tuniers werden die Sieger angezeigt.