# TunierSystem
Bei dem Projekt handelt es sich um ein Tuniersystem mit einer Anzeige.
Es besteht aus 3 wesentlichen Teilen.

#Anforderungen:
Für den Server
 - Einen Server mit zwei freien freigeschalteten TCP Ports.
Für den Client
 - Webbrowser

 

#Server:
Es beinhaltet einen Server, welcher über zwei Ports mit dem Client und dem Gamemaster
kommuniziert. Über den einen können Daten über die Spiele abgerufen werden, über den anderen
werden Befehle gesendet, welche den Verlauf des Spiels bestimmen und die Struktur des Tuniers festlegen.

#Client:
Bei dem Client handelt es sich um eine WebApp.
Jene WebApp zeigt die aktuell laufenden Spiele, Spielstände und die folgenden Spiele
des Tuniers in einer "treeview" an.

#Gamemaster-Anwendung:
Die Gamemaster-Anwendung ist im grunde genommen eine Erweiterung der Client WebApp.
Mit der Gamemaster-Anwendung kann der Gamemaster jede neue Ebene initialisieren und für die Schiedsrichter freigeben.
Des Weiteren, kann man mit dieser Anwendung das Kennwort für jeweilige Schiedsrichter anlegen und jeden Schiedsrichter einem
Spiel zuordnen. Mit dieser Anwendung können ebenfalls die Struktur des Spiels angepasst werden. 


