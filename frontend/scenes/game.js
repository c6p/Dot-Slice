import Koji from '@withkoji/vcc';
import { CONFIG } from '../config';
import { obstacles, paths } from '../assets/data.json'
import paper from 'paper/dist/paper-core'

const { Bounds, Bodies, Body, Vector, Vertices, Sleeping } = Phaser.Physics.Matter.Matter;
const SIZE = 1080;
const IMG_SIZE = 1024;
const { WIDTH, HEIGHT } = CONFIG;
const [X_OFFSET, Y_OFFSET] = [(WIDTH - IMG_SIZE) / 2, (HEIGHT - IMG_SIZE) / 2];
const THICKNESS = 5
const THICKNESS_VISUAL = 5
const TOLERANCE = 0.001

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


export class GameScene extends Phaser.Scene {

  constructor() {
    super({
      key: 'GameScene'
    })
  }

  // TODO scale
  // TODO multiple shapes, holes
  // TODO resolveCrossings in update

  setObstacles(obstacles, paths) {

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

    for (let p of paths) {
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
    }
    for (let i = 1; i < obstacles.length; i++) {
      g[i].strokePath()
    }
  }

  setPathBounds(paths, off = { x: 0, y: 0 }) {
    let parts = [];
    const r = THICKNESS / 2;
    let diff = Vector.create();
    let a = Vector.create();  // above

    for (let path of paths) {
      for (let i = 1; i < path.length; i++) {
        const [o, p] = [path[i - 1], path[i]];  // prev, point
        Vector.sub(p, o, diff);
        const width = Vector.magnitude(diff);
        const offsetVec = Vector.mult(Vector.normalise(diff), -width / 2)
        Vector.add(p, offsetVec, a);
        const angle = Vector.angle(o, p);
        const cap = Bodies.circle(p.x + off.x, p.y + off.x, r);
        const line = Bodies.rectangle(a.x + off.x, a.y + off.x, width, THICKNESS, { angle });
        parts.push(cap, line);
      }
      // ending cap
      const p = path[path.length - 1];
      const cap = Bodies.circle(p.x + off.x, p.y + off.x, r);
      parts.push(cap);
    }
    return parts;
  }

  drawPathMask(texture, paths) {
    const ctx = texture.context;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'xor';
    for (let path of paths) {
      fillPath(ctx, path);
    }
    texture.refresh()
  }

  erasePath(texture, path) {
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
  }

  createBall(radius) {
    const [x, y] = [...Array(2).keys()].map(() => random(WIDTH / 2 - 100, WIDTH / 2 + 100));
    const circle = this.add.circle(x, y, radius, 0xffffff)
    circle.setStrokeStyle(1, 0x666666);
    let ball = this.matter.add.gameObject(circle, { shape: { type: 'circle', radius }, restitution: 1, friction: 0, frictionAir: 0, frictionStatic: 0, render: { visible: false } });
    Body.applyForce(circle.body, { x: 0, y: 0 }, { x: 0.01, y: 0.01 });
    return ball;
  }

  init(data) { }

  preload() {
    this.load.image('game', Koji.config.images.game);
  }

  setState(index, time) {
    const { period, cycles } = obstacles[index];
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
      const c = drawPath.getIntersections(o[i]);
      if (c.length) {
        return true;
      }
    }
    return false;
  }
  checkBalls(drawPath) {
    for (const b of this.balls) {
      const c = drawPath.getIntersections(paper.Path.Circle(b, b.geom._radius));
      if (c.length) {
        return true;
      }
    }
    return false;
  }

  create() {
    new paper.Project(new paper.Size(SIZE, SIZE));

    const texture = this.textures.createCanvas('pathmask', SIZE, SIZE);
    this.drawPathMask(texture, paths)
    const pathmask = this.add.image(0, 0, 'pathmask').setOrigin(0, 0).setVisible(false);
    const bg = this.add.image(X_OFFSET, Y_OFFSET, 'game').setOrigin(0, 0);
    bg.mask = pathmask.createBitmapMask();

    this.cameras.main.setBackgroundColor('#666666')

    const parts = this.setPathBounds(paths);
    let body = Body.create({
      isStatic: true,
      //isSleeping: false,
      restitution: 1,
      parts: [],
      render: { visible: false },
      group: Body.nextGroup(true)
    });
    setParts(body, parts)
    this.matter.world.add(body);

    this.obstacles = [null]
    this.obstaclePaths = [null]
    for (let i = 1; i < obstacles.length; i++) {
      const o = obstacles[i];
      let obstacleObj = this.add.graphics();
      obstacleObj.visible = o.cycles[0] === 0;
      this.obstacles.push(obstacleObj);
      this.obstaclePaths.push(new paper.CompoundPath());
    }
    this.setObstacles(obstacles, paths);

    this.balls = [];
    for (let i = 0; i < 4; i++)
      this.balls.push(this.createBall(i < 2 ? 30 : 15));

    let path = new paper.Path(paths[0].map(({ x, y, index }) => {
      let s = new paper.Segment(new paper.Point(x, y));
      s.point.index = index;
      return s;
    }));
    path.closed = true;
    let isInside = null;

    this.graphics = this.add.graphics();

    const containsBalls = (path) => {
      for (const b of this.balls) {
        if (path.contains(b))
          return true;
      }
      return false;
    }

    this.drawPath = null;
    let oldPath = null;

    const applyPath = () => {
      paths[0] = path.segments.map(({ point: { x, y, index } }) => { return { x, y, index } });
      this.drawPathMask(texture, paths);
      this.setObstacles(obstacles, paths);
      const parts = this.setPathBounds(paths, { x: 0, y: 0 });
      setParts(body, parts)
    }

    const resolveCrossings = () => {
      const co = this.checkObstacles(this.drawPath);
      const cb = this.checkBalls(this.drawPath);
      if (co || cb) {
        this.drawPath = null;
        if (cb && oldPath !== null) {
          path = oldPath;
          oldPath = null;
          applyPath()
        }
        return true;
      }
      return false;
    }
    const pencil = (pointer) => {
      const wasInside = isInside;
      isInside = path.contains(pointer);
      const { x, y } = pointer;
      if (isInside) {
        if (this.drawPath === null)
          return;
        const point = new paper.Point(x, y);
        if (wasInside === false) { // enter path
          this.drawPath.add(path.getNearestPoint(point), point);
        } else {
          this.drawPath.add(point);
          const cross = this.drawPath.getCrossings();
          if (cross.length) {
            const p2 = this.drawPath.splitAt(cross[0]);
            this.drawPath.add(p2.lastSegment);
          }
          resolveCrossings()
        }
      } else {
        if (this.drawPath !== null && wasInside === true) {  // exit path
          const point = new paper.Point(x, y);
          this.drawPath.add(path.getNearestPoint(point));

          if (!resolveCrossings()) {
            this.drawPath.simplify(10);
            this.drawPath.flatten(5);

            // clone path
            const newPath = new paper.Path({
              segments: path.segments,
              closed: true
            });
            for (let i = 0; i < path.segments.length; i++)  // add metadata (obstacle index)
              newPath.segments[i].point.index = path.segments[i].point.index;

            // split shape into two
            let [path1, path2] = splitPath(newPath, this.drawPath);
            const contains1 = containsBalls(path1);
            const contains2 = containsBalls(path2);
            if (contains1 && contains2) {
            } else if (contains1) {
              oldPath = path;
              path = path1;
            } else if (contains2) {
              oldPath = path;
              path = path2;
            }
            applyPath()
            this.drawPath = null;
          }
        }
        if (this.drawPath === null) {
          this.drawPath = new paper.Path();
        }
      }
    }

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        pencil(pointer, this.drawPath);

        this.graphics.clear();
        this.graphics.fillStyle(0xdddddd, 1);
        if (!this.drawPath)
          return;
        const len = this.drawPath.length;
        for (let offset = 0; offset < len; offset += 10) {
          const p = this.drawPath.getPointAt(offset);
          this.graphics.fillCircle(p.x, p.y, 2);
        }
      }
    });
    this.input.on('pointerdown', pencil);
    this.input.on('pointerup', (pointer) => {
      this.graphics.clear();
      this.drawPath = null;
    })
  }

  update(t, dt) {
    this.matter.step(dt)

    for (let i = 2; i < obstacles.length; i++)
      this.setState(i, t);

    /*window.requestAnimationFrame(() => {
      if (this.checkCrossings(this.drawPath)) {
        this.graphics.clear();
        this.drawPath = null;
      }
    })*/
  }

}