let width;
let height;

let horizontalWallList = [];
let verticalWallList = [];

let vp;
let goal;

function setup() {
  width = windowWidth * 2 / 3;
  height = windowHeight * 2 / 3;
  goal = new Vec(width / 2, height / 2);
  vpList = []
  while(true){
    vpList.push(new ViewPoint(new Vec(random(0, width), random(0, height)), random(0, 2 * PI)));
    if(vpList.length >= 5) break;
  }
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

  // 绘制目标点
  stroke('#ffff00');
  strokeWeight(20);
  point(goal.x, goal.y);

  for(let vp of vpList){
    // 绘制自走点
    stroke('#0000ff');
    point(vp.pos.x, vp.pos.y);

    // 自走点前方视线
    let viewLine = Ray.getRayFromPoints(
      vp.pos,
      vp.pos.move(30, vp.angle)
    )

    // 自走点左侧视线
    let leftViewLine = Ray.getRayFromPoints(
      vp.pos,
      vp.pos.move(30, vp.angle - PI / 6)
    )

    // 自走点右侧视线
    let rightViewLine = Ray.getRayFromPoints(
      vp.pos,
      vp.pos.move(30, vp.angle + PI / 6)
    )

    // 自走点左侧传感器
    let leftSensor = Ray.getRayFromPoints(
      vp.pos,
      vp.pos.move(50, vp.angle - PI / 6)
    )

    // 自走点右侧传感器
    let rightSensor = Ray.getRayFromPoints(
      vp.pos,
      vp.pos.move(50, vp.angle + PI / 6)
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
    let goalWayVector = Ray.getRayFromPoints(vp.pos, goal).way;
    if(goalWayVector.mag() > 20){
      if(!forwardNoIntersection){
        vp.pos = vp.pos.move(-5, vp.angle);
        // 绘制阻塞自走点震动效果
        stroke('#0000ff');
        point(vp.pos.x, vp.pos.y);
        vp.pos = vp.pos.move(5, vp.angle);
        if(leftNoIntersection == rightNoIntersection){
          vp.angle += PI / 6 * random([-1, 1]);
        } else if(!leftNoIntersection){
          vp.angle += PI / 15
        } else if(!rightNoIntersection){
          vp.angle -= PI / 15
        }
      } else{
        if(1 - vp.viewLineUnitVector.dotProduct(goalWayVector.unitize()) > 0.01){
          let dRadian = goalWayVector.angle - vp.angle;
          let clockwiseRotation = dRadian / abs(dRadian);
          if(abs(dRadian) < PI){
            if(clockwiseRotation == 1 && rightNoIntersection
              || clockwiseRotation == -1 && leftNoIntersection){
              vp.angle += clockwiseRotation * PI / 15;
            }
          } else{
            if(clockwiseRotation == -1 && rightNoIntersection
              || clockwiseRotation == 1 && leftNoIntersection){
              vp.angle -= clockwiseRotation * PI / 15;
            }
            if(vp.angle >= 2 * PI){
              vp.angle -= 2 * PI;
            }
            if(vp.angle < 0){
              vp.angle += 2 * PI;
            }
          }
        }
        vp.pos = vp.pos.move(5, vp.angle);
      }
    }
  }

  if(keyIsDown(LEFT_ARROW)){
    goal.x -= 5;
  }
  if(keyIsDown(RIGHT_ARROW)){
    goal.x += 5;
  }
  if(keyIsDown(UP_ARROW)){
    goal.y -= 5;
  }
  if (keyIsDown(DOWN_ARROW)) {
    goal.y += 5;
  }
}

// 目标点拖拽函数
function touchMoved(event){
  goal.x = event.clientX - windowWidth / 6;
  goal.y = event.clientY - windowHeight / 6;
}
