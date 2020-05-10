import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';
import paper from 'paper/dist/paper-core'

const { Bounds, Bodies, Body, Vector, Vertices, Sleeping } = Phaser.Physics.Matter.Matter;
const SIZE = 1080;
const OFFSET = SIZE / 2;
const IMG_SIZE = 1024;
const { WIDTH, HEIGHT } = CONFIG;
const Y = 20;
const [X_OFFSET, Y_OFFSET] = [(WIDTH - IMG_SIZE) / 2, (HEIGHT - IMG_SIZE) / 2];
const THICKNESS = 10
const THICKNESS_VISUAL = 8
const TOLERANCE = 0.000001
const DURATION = 20000;

let [oldWidth, oldHeight] = [IMG_SIZE, IMG_SIZE];
let scale = 1;

const tutor = [
  [["SLICE animals beyond the white marker.", "Click & drag to draw a SLICE."], 300],
  ["Be careful! White edges are unSLICable.", 300],
  ["Don't SLICE between the balls.", 300],
  ["Beware! White edges are marching.", 300],
  [["What does not kill me makes me larger.", "Be quick!"], 1000],
]

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function fillPath(ctx, path) {
  if (!path.length)
    return;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath()
  ctx.fill()
}

function fillGraphics(graphics, path) {
  if (!path.length)
    return;
  graphics.beginPath();
  graphics.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    graphics.lineTo(p.x, p.y);
  }
  graphics.closePath()
  graphics.fill()
}

function splitPath(path, crossingPath) {
  const f = Math.fround;
  const findIndex = (path, p) => path.segments.findIndex(({ point: { x, y } }) => f(p.x) === f(x) && f(p.y) === f(y))

  //const isEqual = (p1, p2) => f(p1._x) === f(p2._x) && f(p1._y) === f(p2._y);

  const cf = crossingPath.firstSegment.point;
  const cl = crossingPath.lastSegment.point;

  const [first, last] = [path.getNearestLocation(cf), path.getNearestLocation(cl)]
  const { point1: f1, point2: f2 } = first.curve;
  const { point1: l1, point2: l2 } = last.curve;

  path.splitAt(first);
  let path2 = path.splitAt(last)

  path.join(crossingPath, TOLERANCE);
  path.closed = true
  const li = findIndex(path, cl);
  if (path.segments[li - 1].point === l1)
    path.segments[li].point.index = l2.index;
  else if (path.segments[li - 1].point === l2)
    path.segments[li].point.index = l1.index;

  path2.join(crossingPath, TOLERANCE);
  path2.closed = true
  const fi = findIndex(path2, cf);
  if (path2.segments[fi - 1].point === f2)
    path2.segments[fi].point.index = f1.index;
  else if (path2.segments[fi - 1].point === f1)
    path2.segments[fi].point.index = f2.index;

  return [path, path2];
}

function setParts(body, parts) {
  var i;

  body.parts.length = 0;
  body.parts.push(body);
  body.parent = body;

  for (i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part !== body) {
      part.parent = body;
      body.parts.push(part);
    }
  }

  if (body.parts.length === 1)
    return;

  const s = SIZE / 2;
  const vertices = [{ x: 0, y: 0 }, { x: SIZE, y: 0 }, { x: SIZE, y: SIZE }, { x: 0, y: SIZE }];
  Bounds.update(body.bounds, vertices, body.velocity);

  Body.setMass(body, Infinity);
  Body.setInertia(body, Infinity);
};

function getScale({ _width, _height }) {
  const [width, height] = [Math.ceil(_width), Math.ceil(_height)]
  const [gx, gy] = [width / IMG_SIZE, height / IMG_SIZE];
  return Math.max(gx, gy);
}
/*function setScale(scale) {
  oldWidth = Math.min(IMG_SIZE*scale));
  oldHeight = Math.min(IMG_SIZE*scale));
  //return [oldWidth, oldHeight];
}*/


//function randCoords() {
//  return [...Array(2).keys()].map(() => random(0, IMG_SIZE-1));
//}

export class GameScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'GameScene'
    })
  }

  setObstacles(obstacles, path) {

    const g = this.obstacles;
    const o = this.obstaclePaths;
    for (let i = 1; i < g.length; i++) {
      let graphics = g[i];
      graphics.clear()
      graphics.lineStyle(THICKNESS_VISUAL, 0xffffff);
      graphics.fillStyle(0xffffff);
      graphics.beginPath();
      o[i].removeChildren();
    }

    //for (let p of paths) {
    const p = path;
    let i = p[1].index || 0;
    if (i > 0) {
      g[i].moveTo(p[0].x, p[0].y);
      g[i].lineTo(p[1].x, p[1].y);
      o[i].moveTo(p[0]);
      o[i].lineTo(p[1]);
    }
    for (let j = 2; j < p.length; j++) {
      let oi = p[j].index || 0;
      if (oi === 0) {// no obstacle
        i = 0;
      } else if (i === oi) {
        g[i].lineTo(p[j].x, p[j].y);
        o[i].lineTo(p[j]);
      } else {
        i = oi;
        g[i].moveTo(p[j - 1].x, p[j - 1].y);
        g[i].lineTo(p[j].x, p[j].y);
        o[i].moveTo(p[j - 1]);
        o[i].lineTo(p[j]);
      }
    }
    let oi = p[0].index || 0;
    if (oi === 0) {// no obstacle
      i = 0;
    } else if (i === oi) {
      g[i].lineTo(p[0].x, p[0].y);
      o[i].lineTo(p[0]);
    } else {
      i = oi;
      g[i].moveTo(p[p.length - 1].x, p[p.length - 1].y);
      g[i].lineTo(p[0].x, p[0].y);
      o[i].moveTo(p[p.length - 1]);
      o[i].lineTo(p[0]);
    }
    //}
    for (let i = 1; i < obstacles.length; i++) {
      g[i].strokePath()
    }
    const radius = THICKNESS_VISUAL/2;
    for (let j = 1; j < p.length; j++) {
      let i = p[j].index || 0;
      if (i === 0)
        continue;
      g[i].fillCircle(p[j].x, p[j].y, radius);
    }
  }

  setPathBounds(path, off = { x: 0, y: 0 }) {
    let parts = [];
    const r = THICKNESS / 2;
    let diff = Vector.create();
    let a = Vector.create();  // above

    const addLine = (o, p) => { // prev, point
      Vector.sub(p, o, diff);
      const width = Vector.magnitude(diff);
      const offsetVec = Vector.mult(Vector.normalise(diff), -width / 2)
      Vector.add(p, offsetVec, a);
      const angle = Vector.angle(o, p);
      const cap = Bodies.circle(p.x + off.x, p.y + off.x, r);
      const line = Bodies.rectangle(a.x + off.x, a.y + off.x, width, THICKNESS, { angle });
      parts.push(cap, line);
    }
    for (let i = 1; i < path.length; i++) {
      const [o, p] = [path[i - 1], path[i]];
      addLine(o, p);
    }
    addLine(path[path.length - 1], path[0]);  // close path
    // ending cap
    //const p = path[path.length - 1];
    //const cap = Bodies.circle(p.x + off.x, p.y + off.x, r);
    //parts.push(cap);
    //}
    return parts;
  }

  drawPathMask(texture, path) {
    const ctx = texture.context;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'xor';
    //for (let path of paths) {
    fillPath(ctx, path);
    //}
    texture.refresh()
  }

  setMaskedPath(path, reverse, callback) {
    const graphics = this.make.graphics({ x: X_OFFSET, y: Y_OFFSET });
    fillGraphics(graphics, path);
    const bg = this.add.image(X_OFFSET, Y_OFFSET, 'game').setOrigin(0, 0);
    const mask = graphics.createGeometryMask();
    bg.depth = -10
    bg.setMask(mask);
    let [x, y, angle, alpha] = [512, 1024, 60, 0];
    let duration = 5000;
    if (reverse) {
      if (this.pieceTween !== null) {
        ({ x, y, angle, alpha } = this.pieceTween.targets[0]);
        this.pieceTween.complete();
      }
      graphics.x = bg.x = x;
      graphics.y = bg.y = y;
      graphics.angle = bg.angle = angle;
      graphics.alpha = bg.alpha = alpha;
      duration *= x / (512 * 8);
      //console.log(x,y,angle,alpha,duration);
      [x, y, angle, alpha] = [X_OFFSET, Y_OFFSET, 0, 1];
    } else {
      callback();
    }

    this.pieceTween = this.tweens.add({
      targets: [bg, graphics],
      x: { value: x, duration },
      y: { value: y, duration },
      angle: { value: angle, duration },
      alpha: { value: alpha, duration: duration / 2 },
      onComplete: () => {
        bg.destroy();
        graphics.destroy();
        this.pieceTween = null;
        if (reverse)
          callback();
      }
    });
    //bg.setVisible(false)
    //graphics.setVisible(false)
    //const container = this.add.container(0, 0, [bg,graphics]);
    //container.setSize(64, 64);
    //this.matter.add.gameObject(container);
    //const {x,y} = container.body.position;
    //Body.applyForce(container.body, {x:0,y:0}, {x:0,y:0.01});
    //bg.setPosition(50,50)
    //graphics.setPosition(50,50)
    //return container;
    //this.matter.add([bg, mask])
  }
  /*erasePath(texture, path) {
    const ctx = texture.context;
    ctx.globalCompositeOperation = 'destination-out';
    fillPath(ctx, path);
    texture.refresh()
  }

  addPath(texture, path) {
    const ctx = texture.context;
    ctx.globalCompositeOperation = 'source-over';
    fillPath(ctx, path);
    ctx.stroke(); // fix white borders
    texture.refresh()
  }*/

  createBall(x, y, radius) {
    const circle = this.add.circle(x, y, radius, 0xffffff)
    circle.setStrokeStyle(1, 0x666666);
    let ball = this.matter.add.gameObject(circle, { shape: { type: 'circle', radius }, restitution: 1, friction: 0, frictionAir: 0, frictionStatic: 0, render: { visible: false } });
    Body.applyForce(circle.body, { x, y }, { x: random(-0.015, 0.015), y: random(-0.015, 0.015) });
    return ball;
  }

  setState(index, time) {
    const { period, cycles } = this.level.obstacles[index];
    const i = cycles.findIndex((v) => v >= (time % period));
    const visible = i % 2 === 1;
    const obstacle = this.obstacles[index];
    obstacle.visible = visible
  }

  checkObstacles(drawPath) {
    const o = this.obstaclePaths;
    const g = this.obstacles;
    for (let i = 1; i < o.length; i++) {
      if (!g[i].visible)
        continue;
      //const c = drawPath.getIntersections(o[i]);
      //if (c.length) {
      if (drawPath.intersects(o[i])) {
        return drawPath.getIntersections(o[i])[0].point;
      }
    }
    return null;
  }
  checkBalls(drawPath) {
    for (const b of this.balls) {
      //const c = drawPath.getIntersections(paper.Path.Circle(b, b.geom._radius));
      //if (c.length) {
      if (drawPath.intersects(paper.Path.Circle(b, b.geom._radius))) {
        return true;
      }
    }
    return false;
  }

  scaleDownBalls(globalScale) {
    const scale = (this.firstBallRadius * globalScale) / this.balls[0].body.circleRadius;
    for (let b of this.balls) {
      Body.scale(b.body, scale, scale);
      b.scale = globalScale;
    }
  }

  init({ level }) {
    this.i = level;
    this.level = Koji.config.images.levels[level];
  }

  preload() {
    const { image } = this.level;
    this.pathmaskTexture = this.textures.createCanvas('pathmask', SIZE, SIZE);
    this.load.image('game', image);
  }

  create() {
    if (this.i < tutor.length)
      this.add.text(50, 30, tutor[this.i][0],
        { fontFamily: Koji.config.strings.font.family, fontSize: '30px', fill: Koji.config.colors.button_font, wordWrap: { width: tutor[this.i][1] }, lineSpacing: 5 })
        .setOrigin(0, 0)

    this.slices = 0;
    const { obstacles, targetArea, willScale, backgroundColor, balls } = this.level;
    this.game.progressBar.setVisible(true);
    this.game.pause.setVisible(true);

    let path = this.level.path;
    new paper.Project(new paper.Size(SIZE, SIZE));
    this.game.target.x = targetArea * WIDTH;
    this.game.progress.width = WIDTH;

    let texture = this.pathmaskTexture;
    this.drawPathMask(texture, path);
    const pathmask = this.add.image(0, 0, 'pathmask').setOrigin(0, 0).setVisible(false);
    const bg = this.add.image(X_OFFSET, Y_OFFSET, 'game').setOrigin(0, 0);
    bg.mask = pathmask.createBitmapMask();
    //bg.setVisible(false)

    this.cameras.main.setBackgroundColor(backgroundColor)
    this.cameras.main.setScroll(0, -Y);

    const parts = this.setPathBounds(path);
    let body = Body.create({
      isStatic: true,
      //isSleeping: false,
      restitution: 1,
      parts: [],
      render: { visible: true },
      group: Body.nextGroup(true)
    });
    setParts(body, parts);
    this.matter.world.add(body);

    //this.group = this.add.group([texture, pathmask, bg, body]);
    //this.game.scale.setGameSize(512, 512);
    //this.scale.setGameSize(800, 800);

    this.obstacles = [null]
    this.obstaclePaths = [null]
    for (let i = 1; i < obstacles.length; i++) {
      const o = obstacles[i];
      let obstacleObj = this.add.graphics();
      obstacleObj.visible = o.cycles[0] === 0;
      this.obstacles.push(obstacleObj);
      this.obstaclePaths.push(new paper.CompoundPath());
    }
    this.setObstacles(obstacles, path);

    //this.ballsScale = this.tweens.add({ scale: 1, globalScale: 1, duration: DURATION, paused: true, target: gameScale onUpdate: (tween, target) });

    const lineGraphics = this.add.graphics();
    lineGraphics.fillStyle(0xffffff, 1);
    lineGraphics.fillCircle(3, 3, 3);
    lineGraphics.generateTexture("line_dot");
    lineGraphics.clear();
    lineGraphics.fillStyle(0xffffff, 1);
    lineGraphics.fillRect(-5, -5, 10, 10);
    lineGraphics.generateTexture("line_hit");
    lineGraphics.destroy();
    const lineParticles = this.add.particles("line_dot");
    this.lineEmitter = lineParticles.createEmitter({
      on: false,
      quantity: 1,
      //speedY: -100,
      speedX: { min: -50, max: 50 },
      gravityY: 1000,
      lifespan: 2000,
      particleBringToTop: true,
      //bounds: { x: OFFSET, y: OFFSET, width: WIDTH, height: 2*HEIGHT}
    }).reserve(100);

    const hitParticles = this.add.particles("line_hit");
    const shape1 = new Phaser.Geom.Circle(0, 0, 15);
    this.hitEmitter = hitParticles.createEmitter({
      on: false,
      //quantity: 1,
      speedY: { min: -30, max: 30 },
      speedX: { min: -30, max: 30 },
      //gravityY: 1000,
      lifespan: 300,
      particleBringToTop: true,
      emitZone: { type: 'edge', source: shape1, quantity: 6 }
      //bounds: { x: OFFSET, y: OFFSET, width: WIDTH, height: 2*HEIGHT}
    }).reserve(6);


    let newPath = null;
    this.pieceTween = null;
    //const piecemask = this.make.image({x:0,y:0, key:'piecemask', add: false}).setOrigin(0, 0);
    /*var textures = this.textures;
    const piecemask = this.make.image({x:0,y:0, key:'piecemask', add: false}).setOrigin(0, 0);
    let pieceSource = {
        getRandomPoint: function (vec)
        {
          let [x, y] = [0,0];
          if (newPath !== null) {
            const {left, top, width, height} = newPath.bounds;
            console.log(left, top, width, height)
            do
            {
                x = Phaser.Math.Between(left, left+width-1);
                y = Phaser.Math.Between(top, top+height-1);
            //} while (newPath.contains(new paper.Point(x,y)))
                var pixel = textures.getPixel(left+x, top+y, 'piecemask');
            console.log(x, y, pixel)
            } while (pixel.alpha < 255);
          }

            return vec.setTo(x, y);
        }
    };
    //const pieceShape = new Phaser.Geom.Polygon([]);
    let particles = this.add.particles('burn');
    this.pieceEmitter = particles.createEmitter({
        //emitZone: { type: 'random', source: pieceSource },
        lifespan: 1000,
        //speedY: { min: -500, max: 500 },
        //speedX: { min: -500, max: 500 },
        //speedY: 500,
        //speedX: 500,
        speed: 500,
        //angle: -90,
        //gravityY: 300,
        //scale: { start: 0.4, end: 0 },
        //quantity: 50,
        blendMode: 'ADD',
        on: false
    });
    particles.mask = new Phaser.Display.Masks.BitmapMask(this, piecemask);
    //particles.visible = false;
    //.mask = new Phaser.Display.Masks.BitmapMask(this, particles);*/

    let outline = new paper.Path(path.map(({ x, y, index }) => {
      let s = new paper.Segment(new paper.Point(x, y));
      s.point.index = index;
      return s;
    }));
    outline.closed = true;
    this.area = outline.area;
    let isInside = false;

    this.balls = [];
    const randPoint = () => new paper.Point(random(0, IMG_SIZE - 1), random(0, IMG_SIZE - 1))
    let ballPath = new paper.CompoundPath();
    for (let b of balls) {
      let p = randPoint();
      let circle = new paper.Path.Circle(p, b);
      while (!outline.contains(p) || outline.intersects(circle) || ballPath.intersects(circle)) {
        p = randPoint();
        circle = new paper.Path.Circle(p, b);
      }
      ballPath.addChild(circle);
      //console.log(ballPath);
      this.balls.push(this.createBall(p.x, p.y, b));
    }
    //this.balls.map(x => console.log(x.body.mass))
    this.firstBallRadius = this.balls.length ? this.balls[0].radius : 1;

    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xffffff, 1);
    const containsBalls = (path) => {
      for (const b of this.balls) {
        if (path.contains(b))
          return true;
      }
      return false;
    }

    this.drawPath = null;
    let oldPath = null;


    this.calcArea = (scale = 1) => {
      this.target = (outline.area * (scale * scale) / this.area);
      this.game.progress.width = this.target * WIDTH;  // TODO scale
      if (this.target < targetArea) {
        this.win();
      }
    }

    const applyPath = () => {
      this.slices++;
      this.calcArea();

      if (willScale) {
        //console.log(path.area, this.area, this.progress.width)
        const scale = getScale(outline.bounds);
        //const [w, h] = setScale(scale);
        this.scaleDownBalls(scale);
        //this.scaleUpGame()
        //console.log(scale, globalScale)
        const { _x, _y, _width, _height } = outline.bounds;
        //this.cameras.main.setViewport(_x, _y, oldWidth, oldHeight);
        const factor = 1 / scale;
        this.cameras.main.pan(_x + _width / 2, -Y + _y + _height / 2, DURATION / 5, 'Linear', true);
        const zoom = this.cameras.main.zoom < factor;
        this.cameras.main.zoomTo(factor, zoom ? DURATION : DURATION/4, 'Linear', true);
        console.log(scale, factor)
        //this.cameras.main.setScroll(0,0);
        //this.scene.scale = 1/globalScale;
      }

      if (newPath !== null) {
        let tmpPath = newPath.segments.map(({ point: { x, y, index } }) => { return { x, y } });
        this.setMaskedPath(tmpPath, oldPath === null, () => {
          path = outline.segments.map(({ point: { x, y, index } }) => { return { x, y, index } });
          this.drawPathMask(texture, path);
          this.setObstacles(obstacles, path);
          const parts = this.setPathBounds(path, { x: 0, y: 0 });
          setParts(body, parts)
        });
      }
      /*let tmpPath = newPath.segments.map(({ point: { x, y, index } }) => { return { x, y } });
      //pieceShape.setTo(tmpPath);
      this.drawPathMask(this.piecemaskTexture, tmpPath);
      const c = newPath.bounds.center;
      const {width, height} = newPath.bounds
      const speed = Math.max(width, height);
      this.pieceEmitter.setScale(speed/512);
      this.pieceEmitter.setSpeed({min:-2*speed, max:2*speed});
      this.pieceEmitter.explode(1000, c.x, c.y);
    }*/

      //const parts = this.setPathBounds(path, { x: 0, y: 0 });
      //setParts(body, parts)
    }

    const lineDraw = (points, len, graphics) => {
      graphics.clear();
      for (let i = 0; i < len; i++) {
        const { x, y } = points[i]
        this.graphics.fillCircle(x, y, 3 * scale);
      }
    }

    const drawLine = () => {
      if (!this.drawPath)
        return
      let points = []
      for (let offset = 0; offset < this.drawPath.length; offset += 12) {
        const { x, y } = this.drawPath.getPointAt(offset);
        points.push({ x, y });
      }
      lineDraw(points, points.length, this.graphics);
    }

    const undrawLine = () => {
      if (!this.drawPath)
        return
      let points = []
      for (let offset = 0; offset < this.drawPath.length; offset += 12) {
        const { x, y } = this.drawPath.getPointAt(offset);
        points.push({ x, y });
      }
      const t = this.tweens.addCounter({
        from: points.length,
        to: 0,
        duration: 300,
        onUpdate: () => lineDraw(points, t.getValue(), this.graphics),
      })
      this.drawPath = null;
    }

    const resolveCrossings = () => {
      const co = this.checkObstacles(this.drawPath);
      const cb = this.checkBalls(this.drawPath);
      if (co || cb) {
        if (cb) {
          this.game.crash.play();

          const len = this.drawPath.length;
          for (let offset = 0; offset < len; offset += 12) {
            const p = this.drawPath.getPointAt(offset);
            this.lineEmitter.emitParticleAt(p.x + OFFSET, p.y + OFFSET);
          }

          if (oldPath !== null) {
            outline = oldPath;
            oldPath = null;
            applyPath()
            newPath = null;
          }
        } else {
          this.game.hit.play();
          const { x, y } = co;
          this.hitEmitter.explode(6, x + OFFSET, y + OFFSET)
        }
        this.graphics.clear();
        this.drawPath = null;
        return true;
      }
      return false;
    }
    let point = null;
    const pencil = (pointer) => {
      const wasInside = isInside;
      const [x, y] = [pointer.worldX, pointer.worldY];
      isInside = outline.contains({ x, y });
      let prevPoint = point;
      //const { x, y } = pointer;
      //console.log(x,y)
      point = new paper.Point(x, y);
      if (isInside) {
        if (wasInside === false) { // enter path
          // console.log("WAS OUTSIDE", x, y)
          this.drawPath = new paper.Path([prevPoint, point]);
          const cross = this.drawPath.getCrossings(outline);
          if (cross.length) {
            //if (cross.length > 1)
            //  console.log("IN CROSS", cross)
            this.drawPath.removeSegment(0);
            this.drawPath.insert(0, cross[0].point)
          }
          //this.drawPath.add(outline.getNearestPoint(point), point);
        } else {
          if (this.drawPath !== null) {
            //console.log("WAS INSIDE", x, y)
            // if (this.drawPath.length) {
            this.drawPath.add(point);
            const cross = this.drawPath.getCrossings();
            if (cross.length) {
              const p2 = this.drawPath.splitAt(cross[0]);
              this.drawPath.add(p2.lastSegment);
            }
            resolveCrossings()
          }
          //}
        }
      } else {
        //console.log("IS OUTSIDE", x, y)
        if (this.drawPath !== null && this.drawPath.length && wasInside === true) {  // exit path
          //const point = new paper.Point(x, y);
          this.drawPath.add(point);
          this.drawPath.simplify(10);
          this.drawPath.flatten(5);
          const cross = this.drawPath.getCrossings(outline);
          if (cross.length) {
            //if (cross.length > 1)
            //  console.log("OUT CROSS", cross)
            this.drawPath.splitAt(cross[0]);
            //this.drawPath.removeSegment(this.drawPath.length-1);
            this.drawPath.add(cross[0].point)
          }
          //this.drawPath.add(outline.getNearestPoint(point));

          if (!resolveCrossings()) {
            // clone path
            const clonePath = new paper.Path({
              segments: outline.segments,
              closed: true
            });
            for (let i = 0; i < outline.segments.length; i++)  // add metadata (obstacle index)
              clonePath.segments[i].point.index = outline.segments[i].point.index;

            // split shape into two
            let [path1, path2] = splitPath(clonePath, this.drawPath);
            const contains1 = containsBalls(path1);
            const contains2 = containsBalls(path2);
            let pathChanged = true;
            if (contains1 && contains2) {
              undrawLine();
              this.game.nocut.play();
              pathChanged = false;
            } else if (contains1) {
              oldPath = outline;
              outline = path1;
              newPath = path2;
            } else if (contains2) {
              oldPath = outline;
              outline = path2;
              newPath = path1;
            } else {
              oldPath = outline;
              const p1great = Math.abs(path1.area) > Math.abs(path2.area);
              outline = p1great ? path1 : path2;
              newPath = p1great ? path2 : path1;
            }
            this.graphics.clear();
            this.drawPath = null;
            if (pathChanged) {
              this.game.cut.play();
              applyPath()
            }
          }
        }
        //if (this.drawPath === null) {
        //  this.drawPath = new paper.Path();
        //}
      }
    }

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        pencil(pointer);
        drawLine();
      }
    });
    this.input.on('pointerdown', pencil);
    this.input.on('pointerup', () => {
      undrawLine();
    })

    this.events.on('shutdown', () => {
      this.input.removeAllListeners();
      this.textures.remove('game');
      this.textures.remove('pathmask');
    })
  }

  win() {
    this.scene.pause();
    let text = [this.i + 1, "Area: " + Math.round(this.target * 100) + ' %', "Slices: " + this.slices];
    //console.log(text)
    this.game.areaText.setText(text[1]);
    this.game.slicesText.setText(text[2]);
    this.game.winMenu.setVisible(true);
    window.localStorage.setItem(this.i + 1, JSON.stringify(text));
  }

  update(t, dt) {
    this.matter.step(dt)

    for (let i = 2; i < this.level.obstacles.length; i++)
      this.setState(i, t);

    if (this.level.willScale && this.cameras.main.zoom !== 1) {
      this.calcArea(this.cameras.main.zoom);
    }
    /*window.requestAnimationFrame(() => {
      if (this.checkCrossings(this.drawPath)) {
        this.graphics.clear();
        this.drawPath = null;
      }
    })*/
  }

}