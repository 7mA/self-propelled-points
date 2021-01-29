function setup() {
  width = windowWidth * 2 / 3;
  height = windowHeight * 2 / 3;
  generatedEnemyColor = color('#0000ff');
  expiringEnemyColor = color('#0099FF');
  itemColor = color('#ff0000');
  playerColor = color('#ffff00');

  createCanvas(width, height);
}

function draw() {
  background(220);

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

  if(!isGameStart) return;

  // 绘制玩家点
  stroke(playerColor);
  strokeWeight(20);
  point(player.pos.x, player.pos.y);

  remainingTime = max(intervalTime - (getCurrentTime() - lastPickUpTime), 0);
  for(let i = 0; i < itemList.length; i++){
    let item = itemList[i];

    // 绘制道具
    if(item.status == ITEM_STATUS_GENERATED && (getCurrentTime() - item.generatedTime) / 500 > 1){
      item.status = ITEM_STATUS_ACTIVE;
    }
    stroke(itemColor);
    if(item.status == ITEM_STATUS_GENERATED){
      push();
      strokeWeight((getCurrentTime() - item.generatedTime) / 500 * 20);
      point(item.pos.x, item.pos.y);
      pop();
      continue;
    }
    point(item.pos.x, item.pos.y);

    // 拾捡道具
    if(player.pos.sub(item.pos).mag() < 20){
      player.addScoreByPickUp(remainingTime, intervalTime);
      lastPickUpTime = getCurrentTime();
      itemList.splice(i, 1);
      i--;
    }
  }

  // 场上无道具时，生成新的道具
  if(itemList.length == 0){
    itemList.push(new Item(new Vec(random(0, width), random(0, height)), getCurrentTime()));
  }

  // 填充敌人列表
  fillEnemyList();

  for(let i = 0; i < enemyList.length; i++){
    if(getCurrentTime() - enemyList[i].generatedTime > enemyList[i].lifeSpan && player.isAlive){
      if(random(-2, 2) > 1){
        itemList.push(new Item(enemyList[i].vp.pos.copy(), getCurrentTime()));
      }
      enemyList.splice(i, 1);
      i--;
      player.addScoreByEscape();
      continue;
    }

    // 绘制敌人
    enemy = enemyList[i];
    if(enemy.status == ENEMY_STATUS_GENERATED && (getCurrentTime() - enemy.generatedTime) / 500 > 1){
      enemy.status = ENEMY_STATUS_ACTIVE;
    }if(enemy.status == ENEMY_STATUS_ACTIVE && (enemy.lifeSpan - (getCurrentTime() - enemy.generatedTime)) / 500 < 1){
      enemy.status = ENEMY_STATUS_EXPIRING;
    }
    stroke(lerpColor(generatedEnemyColor, expiringEnemyColor, (getCurrentTime() - enemy.generatedTime) / enemy.lifeSpan));
    if(enemy.status == ENEMY_STATUS_GENERATED){
      push();
      strokeWeight((getCurrentTime() - enemy.generatedTime) / 500 * 20);
      point(enemy.vp.pos.x, enemy.vp.pos.y);
      pop();
      continue;
    } else if(enemy.status == ENEMY_STATUS_EXPIRING){
      push();
      strokeWeight((enemy.lifeSpan - (getCurrentTime() - enemy.generatedTime)) / 500 * 20);
      point(enemy.vp.pos.x, enemy.vp.pos.y);
      pop();
      continue;
    } else {
      point(enemy.vp.pos.x, enemy.vp.pos.y);
    }

    // 敌人前方视线
    let viewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle)
    )

    // 敌人左侧视线
    let leftViewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle - PI / 6)
    )

    // 敌人右侧视线
    let rightViewLine = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(30, enemy.vp.angle + PI / 6)
    )

    // 敌人左侧传感器
    let leftSensor = Ray.getRayFromPoints(
      enemy.vp.pos,
      enemy.vp.pos.move(50, enemy.vp.angle - PI / 6)
    )

    // 敌人右侧传感器
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

    // 调整敌人视线角度并前进
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
        enemy.vp.angle = backToBetween0To2Pi(enemy.vp.angle);
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
          }
          enemy.vp.angle = backToBetween0To2Pi(enemy.vp.angle);
        }
        enemy.vp.pos = enemy.vp.pos.move(enemySpeed, enemy.vp.angle);
      }
    } else {
      stopGame(GAME_OVER_BY_TOUCH_ENEMY);
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

  // 重新计算游戏难度
  updateEnemyData();

  strokeWeight(3);
  stroke('#fff');
  text("Score: " + player.score, width / 20, height * 2 / 40);

  let duration = getCurrentTime() - gameStartTime;
  duration = (duration / 1000).toFixed(3);
  text("Time: " + duration + " s", width / 20, height * 3 / 40);

  if(getCurrentTime() - lastPickUpTime > intervalTime){
    stopGame(GAME_OVER_BY_HUNGRY_FOR_ITEM);
  }
  remainingTime = (remainingTime / 1000).toFixed(3);
  push();
  if(remainingTime < 5) fill('#f00');
  text("Touch the Red in: " + remainingTime + " s", width / 20, height * 4 / 40);
  pop();
}
