let width;
let height;
let deepBlue;
let lightBlue;

let horizontalWallList = [];
let verticalWallList = [];

let player;

let enemyLifeSpan;
let enemyListMaxLength;
let enemyList = [];
let enemySpeed;

let itemList = [];

let gameStartTime;
let lastPickUpTime;
let gameStopTime;
let remainingTime;
let intervalTime;

function setup() {
  width = windowWidth * 2 / 3;
  height = windowHeight * 2 / 3;
  deepBlue = color('#0000ff');
  lightBlue = color('#0099FF');

  player = new Player(new Vec(width / 2, height / 2));

  updateEnemyData();
  fillEnemyList();

  itemList.push(new Vec(random(0, width), random(0, height)));

  gameStartTime = Date.now();
  lastPickUpTime = Date.now();
  remainingTime = 15000;
  intervalTime = 15000;

  createCanvas(width, height);
}

function draw() {
  background(220);

  remainingTime = max(intervalTime - (Date.now() - lastPickUpTime), 0);
  if(!player.isAlive) {
    remainingTime = max(intervalTime - (gameStopTime - lastPickUpTime), 0);
  }

  // 初始化角落点
  let leftTopPoint = new Vec(0, 0);
  let leftBottomPoint = new Vec(0, height);
  let rightTopPoint = new Vec(width, 0);
  let rightBottomPoint = new Vec(width, height);

  // 初始化边界线
  let topEdge = Ray.getRayFromPoints(leftTopPoint, rightTopPoint);
  let leftEdge = Ray.getRayFromPoints(leftTopPoint, leftBottomPoint);
  let bottomEdge = Ray.getRayFromPoints(leftBottomPoint, rightBottomPoint);
  let rightEdge = Ray.getRayFromPoints(rightTopPoint, rightBottomPoint);

  // 初次生成水平随机墙壁
  while(horizontalWallList.length < 7){
    if(horizontalWallList.length == 0){
      horizontalWallList = [topEdge, bottomEdge];
    }
    let moveDistance = random(height);
    if(moveDistance == height / 2) continue;
    let tempWall = Ray.getRayFromPoints(
      new Vec(random(width), 0).move(moveDistance, PI / 2),
      new Vec(random(width), 0).move(moveDistance, PI / 2)
    )
    if(tempWall.intersection(leftEdge) != null && tempWall.intersection(rightEdge) != null) continue;
    horizontalWallList.push(tempWall);
  }

  // 初次生成垂直随机墙壁
  while(verticalWallList.length < 7){
    if(verticalWallList.length == 0){
      verticalWallList = [leftEdge, rightEdge];
    }
    let moveDistance = random(width);
    if(moveDistance == width / 2) continue;
    let tempWall = Ray.getRayFromPoints(
      new Vec(0, random(height)).move(moveDistance, 0),
      new Vec(0, random(height)).move(moveDistance, 0)
    )
    if(tempWall.intersection(topEdge) != null && tempWall.intersection(bottomEdge) != null) continue;
    verticalWallList.push(tempWall);
  }

  let wallList = horizontalWallList.concat(verticalWallList);

  stroke(51);
  strokeWeight(10);

  // 绘制水平随机墙壁
  for(let hw of horizontalWallList){
    line(hw.begin.x, hw.begin.y, hw.end.x, hw.end.y);
  }

  // 绘制垂直随机墙壁
  for(let vw of verticalWallList){
    line(vw.begin.x, vw.begin.y, vw.end.x, vw.end.y);
  }

  // 绘制目标点
  stroke('#ffff00');
  strokeWeight(20);
  point(player.pos.x, player.pos.y);

  // 填充敌人列表
  fillEnemyList();

  for(let i = 0; i < enemyList.length; i++){
    if(Date.now() - enemyList[i].generatedTime > enemyList[i].lifeSpan && player.isAlive){
      if(random(-2, 2) > 1){
        itemList.push(enemyList[i].vp.pos.copy());
      }
      enemyList.splice(i, 1);
      i--;
      player.addScoreByEscape();
      continue;
    }

    // 绘制自走点
    enemy = enemyList[i];
    stroke(lerpColor(deepBlue, lightBlue, (Date.now() - enemy.generatedTime) / enemy.lifeSpan));
    if(!player.isAlive){
      stroke(lerpColor(deepBlue, lightBlue, (gameStopTime - enemy.generatedTime) / enemy.lifeSpan));
    }
    point(enemy.vp.pos.x, enemy.vp.pos.y);

    // 自走点前方视线
    let viewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle)
    )

    // 自走点左侧视线
    let leftViewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle - PI / 6)
    )

    // 自走点右侧视线
    let rightViewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle + PI / 6)
    )

    // 自走点左侧传感器
    let leftSensor = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(50, enemy.vp.angle - PI / 6)
    )

    // 自走点右侧传感器
    let rightSensor = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(50, enemy.vp.angle + PI / 6)
    )

    // 用左传感器探测墙壁
    let leftNoIntersection = true;
    for(let wall of wallList){
      if(leftSensor.intersection(wall) != null){
        leftNoIntersection = false;
        break;
      }
    }

    // 用右传感器探测墙壁
    let rightNoIntersection = true;
    for(let wall of wallList){
      if(rightSensor.intersection(wall) != null){
        rightNoIntersection = false;
        break;
      }
    }

    // 用视线探测墙壁
    let forwardNoIntersection = true;
    for(let wall of wallList){
      if(viewLine.intersection(wall) != null){
        forwardNoIntersection = false;
        break;
      }
      if(leftViewLine.intersection(wall) != null){
        forwardNoIntersection = false;
        break;
      }
      if(rightViewLine.intersection(wall) != null){
        forwardNoIntersection = false;
        break;
      }
    }

    // 调整自走点视线角度并前进
    let playerWayVector = Ray.getRayFromPoints(enemy.vp.pos, player.pos).way;
    if(playerWayVector.mag() > 20){
      if(!forwardNoIntersection){
        // 绘制阻塞自走点震动效果
        enemy.vp.pos = enemy.vp.pos.move(-enemySpeed, enemy.vp.angle);
        point(enemy.vp.pos.x, enemy.vp.pos.y);
        enemy.vp.pos = enemy.vp.pos.move(enemySpeed, enemy.vp.angle);
        if(leftNoIntersection == rightNoIntersection){
          enemy.vp.angle += PI / 6 * random([-1, 1]);
        } else if(!leftNoIntersection){
          enemy.vp.angle += PI / 15
        } else if(!rightNoIntersection){
          enemy.vp.angle -= PI / 15
        }
      } else{
        if(1 - enemy.vp.viewLineUnitVector.dotProduct(playerWayVector.unitize()) > 0.01){
          let dRadian = playerWayVector.angle - enemy.vp.angle;
          let clockwiseRotation = dRadian / abs(dRadian);
          if(abs(dRadian) < PI){
            if(clockwiseRotation == 1 && rightNoIntersection
              || clockwiseRotation == -1 && leftNoIntersection){
              enemy.vp.angle += clockwiseRotation * PI / 15;
            }
          } else{
            if(clockwiseRotation == -1 && rightNoIntersection
              || clockwiseRotation == 1 && leftNoIntersection){
              enemy.vp.angle -= clockwiseRotation * PI / 15;
            }
            if(enemy.vp.angle >= 2 * PI){
              enemy.vp.angle -= 2 * PI;
            }
            if(enemy.vp.angle < 0){
              enemy.vp.angle += 2 * PI;
            }
          }
        }
        enemy.vp.pos = enemy.vp.pos.move(enemySpeed, enemy.vp.angle);
      }
    } else {
      stopGame();
    }
  }

  // 方向键控制玩家点
  if(keyIsDown(LEFT_ARROW)){
    let flag = true;
    let viewLine = Ray.getRayFromPoints(player.pos, player.pos.move(20, PI));
    for(let wall of wallList){
      if(wall.intersection(viewLine) !== null){
        flag = false;
      }
    }
    if(flag){
      player.pos.x -= player.speed;
    }
  }
  if(keyIsDown(RIGHT_ARROW)){
    let flag = true;
    let viewLine = Ray.getRayFromPoints(player.pos, player.pos.move(20, 0));
    for(let wall of wallList){
      if(wall.intersection(viewLine) !== null){
        flag = false;
      }
    }
    if(flag){
      player.pos.x += player.speed;
    }
  }
  if(keyIsDown(UP_ARROW)){
    let flag = true;
    let viewLine = Ray.getRayFromPoints(player.pos, player.pos.move(20, 3 * PI / 2));
    for(let wall of wallList){
      if(wall.intersection(viewLine) !== null){
        flag = false;
      }
    }
    if(flag){
      player.pos.y -= player.speed;
    }
  }
  if(keyIsDown(DOWN_ARROW)){
    let flag = true;
    let viewLine = Ray.getRayFromPoints(player.pos, player.pos.move(20, PI / 2));
    for(let wall of wallList){
      if(wall.intersection(viewLine) !== null){
        flag = false;
      }
    }
    if(flag){
      player.pos.y += player.speed;
    }
  }

  for(let i = 0; i < itemList.length; i++){
    let item = itemList[i];

    // 绘制道具
    stroke('#ff0000');
    point(item.x, item.y);

    // 拾捡道具
    if(player.pos.sub(item).mag() < 20){
      player.addScoreByPickUp(remainingTime, intervalTime);
      lastPickUpTime = Date.now();
      itemList.splice(i, 1);
      i--;
    }
  }

  // 场上无道具时，生成新的道具
  if(itemList.length == 0){
    itemList.push(new Vec(random(0, width), random(0, height)));
  }

  // 重新计算游戏难度
  updateEnemyData();

  strokeWeight(3);
  stroke('#fff');
  text("score: " + player.score, width / 20, height * 2 / 40);

  let duration = Date.now() - gameStartTime;
  if(!player.isAlive) duration = gameStopTime - gameStartTime;
  duration = (duration / 1000).toFixed(3);
  text("Time: " + duration + " s", width / 20, height * 3 / 40);

  if(Date.now() - lastPickUpTime > intervalTime){
    stopGame();
  }
  remainingTime = (remainingTime / 1000).toFixed(3);
  text("Pick Up Count Down: " + remainingTime + " s", width / 20, height * 4 / 40);

  if(!player.isAlive) {
    push();
    textSize(32);
    textAlign(CENTER);
    text("Game Over!", width / 2, height / 2);
    pop();
  }
}

updateEnemyData = function(){
  if(!player.isAlive) return;
  enemyListMaxLength = player.score / 2000 + 3;
  enemyLifeSpan = (player.score / 1000 + 5) * 1000;
  enemySpeed = min(player.score / 3000 + 1, 5);
  player.updateSpeed();
}

stopGame = function(){
  if(player.isAlive){
    enemySpeed = 0;
    player.speed = 0;
    gameStopTime = Date.now();
  }
  player.gameOver();
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

// 玩家点拖拽函数
// Debug用
// function touchMoved(event){
//   player.pos.x = event.clientX - windowWidth / 6;
//   player.pos.y = event.clientY - windowHeight / 6;
// }
