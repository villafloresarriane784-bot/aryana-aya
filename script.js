let health = 100
let energy = 100
let happiness = 100
let day = 1

function updateStats(){

document.getElementById("health").innerHTML="Health: "+health
document.getElementById("energy").innerHTML="Energy: "+energy
document.getElementById("happiness").innerHTML="Happiness: "+happiness
document.getElementById("day").innerHTML="Day: "+day

checkGame()

}

function nextDay(){
day++
updateStats()
}

function eatHealthy(){

health += 10
happiness += 5

message("You ate healthy food! 🍎")

nextDay()

}

function eatJunk(){

health -= 10
happiness += 10

message("Tasty but unhealthy! 🍔")

nextDay()

}

function exercise(){

health += 15
energy -= 10

message("You exercised! 🏃")

nextDay()

}

function sleep(){

energy += 20

message("You slept well 😴")

nextDay()

}

function internet(){

energy -= 10
health -= 5

message("Too much internet! 📱")

nextDay()

}

function message(text){
document.getElementById("message").innerHTML=text
}

function checkGame(){

if(health <=0 || energy <=0){
document.getElementById("gameOver").innerHTML="Game Over!"
}

if(day > 7){
document.getElementById("gameOver").innerHTML="You survived the week! 🎉"
}

}

updateStats()