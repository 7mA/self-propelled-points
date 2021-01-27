/**
 * 玩家类
 * @prop {Vec} pos 位置坐标
 * @prop {boolean} isAlive 存活状态
 * @prop {number} score 分数
 * @prop {number} survivalTime 存活时间（秒）
 * @prop {number} speed 移动速度
 */
class Player {

  /**
   * 构建玩家类
   * @param {Vec} pos 初始位置
   */
  constructor(pos){
    this.pos = pos;
    this.isAlive = true;
    this.score = 0;
    this.survivalTime = 0;
    this.speed = 2;
  }

  /**
   * 加算拾捡分数
   * @param {number} remainingTime 剩余时间
   * @param {number} intervalTime 间隔时间
   */
  addScoreByPickUp(remainingTime, intervalTime){
    this.score += Number.parseInt(100 + 400 * (remainingTime / intervalTime));
  }

  /**
   * 加算摆脱分数
   */
  addScoreByEscape(){
    this.score += 50;
  }

  /**
   * 游戏结束
   */
  gameOver(){
    this.isAlive = false;
  }

  /**
   * 调整速度
   */
  updateSpeed(){
    this.speed = min(this.score / 3000 + 2, 6)
  }

}

/**
 * 敌人类
 * @prop {ViewPoint} vp 敌人视点
 * @prop {number} generatedTime 生成时间 (ms)
 * @prop {number} lifeSpan 存活时间 (ms)
 */
class Enemy{

  /**
   * 构建敌人类
   * @param {ViewPoint} vp 敌人视点
   * @param {number} generatedTime 生成时间 (ms)
   * @param {number} lifeSpan 存活时间 (ms)
   */
  constructor(vp, generatedTime, lifeSpan){
    this.vp = vp;
    this.generatedTime = generatedTime;
    this.lifeSpan = lifeSpan;
  }
}
