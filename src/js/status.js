let width;
let height;

let generatedEnemyColor;
let expiringEnemyColor;
let itemColor;
let playerColor;

let horizontalWallList = [];
let verticalWallList = [];

let player;

let enemyLifeSpan;
let enemyListMaxLength;
let enemyList = [];
let enemySpeed;

let itemList = [];

let isGameStart = false;

let gameStartTime;
let lastPickUpTime;
let gameStopTime;
let remainingTime;
const intervalTime = 15000;

startGame = function(){
  document.getElementById("readyDialog").style.display = "none";

  player = new Player(new Vec(width / 2, height / 2));

  updateEnemyData();
  fillEnemyList();

  itemList.push(new Item(new Vec(random(0, width), random(0, height)), getCurrentTime()));

  gameStartTime = Date.now();
  lastPickUpTime = Date.now();
  remainingTime = intervalTime;

  isGameStart = true;
}

retryGame = function(){
  document.getElementById("retryDialog").style.display = "none";

  horizontalWallList = [];
  verticalWallList = [];
  enemyList = [];
  itemList = [];

  player = new Player(new Vec(width / 2, height / 2));

  updateEnemyData();
  fillEnemyList();

  itemList.push(new Item(new Vec(random(0, width), random(0, height)), getCurrentTime()));

  gameStartTime = Date.now();
  lastPickUpTime = Date.now();
  remainingTime = intervalTime;

  isGameStart = true;
}

stopGame = function(reason){
  if(player.isAlive){
    enemySpeed = 0;
    player.speed = 0;
    gameStopTime = Date.now();
  }
  player.isAlive = false;
  document.getElementById("retryDialog").style.display = "block";
  if(reason === GAME_OVER_BY_TOUCH_ENEMY){
    document.getElementById("gameOverReason").innerHTML = "You didn't run away from the blue!";
  } else if(reason === GAME_OVER_BY_HUNGRY_FOR_ITEM){
    document.getElementById("gameOverReason").innerHTML = "You didn't touch the red in time!";
  }
  document.getElementById("gameOverScore").innerHTML = player.score;
  document.getElementById("gameOverTime").innerHTML = ((getCurrentTime() - gameStartTime) / 1000).toFixed(3);
}

updateEnemyData = function(){
  if(!player.isAlive) return;
  enemyListMaxLength = player.score / 2000 + 3;
  enemyLifeSpan = (player.score / 1000 + 5) * 1000;
  enemySpeed = min(player.score / 3000 + 1, 5);
  player.updateSpeed();
}

fillEnemyList = function(){
  if(!player.isAlive) return;
  while(enemyList.length < enemyListMaxLength){
    let enemy = new Enemy(
      new ViewPoint(
        new Vec(random(0, width),
          random(0, height)),
        random(0, 2 * PI)),
        Date.now(),
        enemyLifeSpan + random(-1000, 1000));
    enemyList.push(enemy);
  }
}

getCurrentTime = function(){
  if(!player.isAlive) return gameStopTime;
  return Date.now();
}

backToBetween0To2Pi = function(angle){
  while(angle >= 2 * PI){
    angle -= 2 * PI;
  }
  while(angle < 0){
    angle += 2 * PI;
  }
  return angle;
}
