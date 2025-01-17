const {Engine, World, Bodies,
    Mouse, MouseConstraint,
    Body, Constraint, Events
} = Matter;

let engine, world, ground,
  objects = [], boxImg, wood2Img, stoneImg, groundImg, starImg,
  bird, birdImg = [], slingshot,
  mc, backgroundImg, slingshotImg;
let trajectoryPoints = [];

let score = 0;
let birdsCount = 0;
let totalBirds = 4;
let isGameOver = false;
let width = 800;
let height = 500;

let turnDelay = 2000; 
let isChangingTurn = false;
let lastBirdLaunchTime = null;
function setup(){
  
  const canvas = 
    createCanvas(width,height);
  
  boxImg = loadImage("img/wood1.png");
  wood2Img = loadImage("img/wood2.png");
  stoneImg = loadImage("img/stone.png");
  groundImg = loadImage("img/ground3.png");
  backgroundImg = loadImage("img/background2.jpg");
  slingshotImg = loadImage("img/slingshot.png");
  starImg = loadImage("img/star.png");
  
  birdImg = [
    loadImage("img/red.png"),
    loadImage("img/yellow.png"),
  ] 
  
  engine = Engine.create();
  world = engine.world;
  
  const mouse = Mouse.create(canvas.elt);
  mouse.pixelRatio = pixelDensity();
  mc =
    MouseConstraint.create(engine,
    {
      mouse: mouse,
      collisionFilter: {mask: 2}
    });
  World.add(world, mc);
  
  ground = new Ground(
    width/2, height-10,
    width, 20, groundImg
  );
  createMap();
  
  bird = new Bird(
    100, 200, 15, birdImg[0]);
    
  slingshot = new SlingShot(
    bird);
    
  /*Events.on(engine,
    'afterUpdate',
    () => slingshot.fly(mc)
    );*/
}

function createMap() {
  objects= [];
  objects.push(new Box( 380, height - 40, 40, 40, boxImg));
  objects.push(new Box( 620, height - 40, 40, 40, boxImg));
  objects.push(new Box( 500, height - 40, 40, 40, boxImg));

  objects.push(new Box( 580, height - 50, 150, 10, wood2Img)); 
  objects.push(new Box( 420, height - 50, 150, 10, wood2Img)); 

  objects.push(new Stone( 430, height - 90, 40, 40, stoneImg)); 
  objects.push(new Stone( 570, height - 90, 40, 40, stoneImg)); 
  objects.push(new Stone( 350, height - 90, 10, 40, stoneImg));
  objects.push(new Stone( 650, height - 90, 10, 40, stoneImg));

  objects.push(new Box( 500, height - 100, 200, 10, wood2Img));
  objects.push(new Box( 500, height - 100, 200, 10, wood2Img));

  objects.push(new Stone( 430, height - 160, 20, 70, stoneImg)); 
  objects.push(new Stone( 570, height - 160, 20, 70, stoneImg));

  objects.push(new Box( 500, height - 180, 170, 10, wood2Img));

  objects.push(new Box( 430, height - 220, 40, 40, boxImg)); 
  objects.push(new Box( 570, height - 220, 40, 40, boxImg)); 

}

function draw(){
  imageMode(CORNER);
  image(backgroundImg, 0, 0, width, height);
  Engine.update(engine);
  
  if (!isGameOver){
    // Update trajectory points only when pulling slingshot
    if (mc.mouse.button === 0 && slingshot.sling.bodyB) {
      trajectoryPoints = calculateTrajectoryPoints(bird, slingshot);
    } else if (!slingshot.sling.bodyB) {
      trajectoryPoints = []; // Clear points when bird is launched
    }
    
    // Draw trajectory points
    push();
    fill(255);
    noStroke();
    for (let point of trajectoryPoints) {
      ellipse(point.x, point.y, 4, 4);
    }
    pop();
    
    slingshot.fly(mc); 
    
    for (const box of objects){
      box.show();
    }
    
    slingshot.show();
    bird.show();  
    ground.show();
    checkIfBirdStopped();
    displayScoreAndStars(score);
    if (birdsCount === totalBirds) {
      isGameOver = true;
    }
  }else {
    showGameOverScreen(score);
  }
}

function keyPressed() {
  if (isGameOver) {
    resetGame();
  }
}
function mousePressed() {
  if (isGameOver) {
    resetGame();
  }
}
function resetGame() {
  isGameOver = false;
  score = 0;
  birdsCount = 0;
  World.clear(world,false);
  setup()
}
function showGameOverScreen(score) {
  const stars = getStars(score); 
  const centerX = width / 2;
  const centerY = height / 2;

  push();
  fill(0, 0, 0, 200);
  rectMode(CENTER);
  rect(centerX, centerY, 400, 300, 20);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text(`Score: ${score}`, centerX, centerY - 40);

  const starSize = 40;
  const starSpacing = 60;

  for (let i = 0; i < stars; i++) {
    image(starImg, centerX - (starSpacing * (stars - 1)) / 2 + i * starSpacing, centerY, starSize, starSize);
  }

  textSize(18);
  fill(255, 200, 0);
  text("Click to Restart", centerX, centerY + 100);
  pop();
}
function displayScoreAndStars(score) {
  const stars = getStars(score);
  const starSize = 30;
  const padding = 20; 
  const xStart = width - padding - starSize; 
  const yStart = padding;

  push();
  fill(255);
  textSize(30);
  textStyle(BOLD);
  textAlign(RIGHT);
  
  text(`Score: ${score}`, width - padding, yStart+ 10);

  for (let i = 0; i < stars; i++) {
    image(starImg, xStart - i * (starSize + 5), yStart + 30, starSize, starSize);
  }
  pop();
}

function getStars(score) {
  if (score >= 300) return 3; 
  if (score >= 200) return 2; 
  if (score >= 100) return 1;
  return 0; 
}

function checkIfBirdStopped() {
  if (!bird || !bird.body) return;

  // Velocidad del pájaro
  const velocity = bird.body.velocity;
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

  // Si el pájaro está detenido y no estamos ya cambiando de turno
  if (speed < 0.1 && !slingshot.sling.bodyB && !isChangingTurn) {
    isChangingTurn = true;
    setTimeout(() => {
      prepareNextBird();
      isChangingTurn = false;
    }, turnDelay); // Esperar unos segundos antes de preparar el siguiente pájaro
  }
}

function prepareNextBird() {
  bird.clear();
  birdsCount++;
  const index = floor(random(0, birdImg.length));

  bird = new Bird(100, 200, 15, birdImg[index]);
  slingshot.attach(bird);
}

function calculateTrajectoryPoints(bird, sling) {
  if (!sling.sling.bodyB) return []; // Return empty array if bird is launched
  
  const points = [];
  const position = bird.body.position;
  const anchorPos = sling.sling.pointA;
  
  // Calculate velocity based on how far the bird is pulled
  const force = {
    x: (anchorPos.x - position.x) * 0.2,
    y: (anchorPos.y - position.y) * 0.2
  };
  
  // Simulate positions
  let x = position.x;
  let y = position.y;
  let velocityX = force.x;
  let velocityY = force.y;
  
  // Calculate points
  for (let i = 0; i < 10; i++) {
    points.push({x, y});
    
    // Update position
    x += velocityX * 3;
    y += velocityY * 3;
    
    // Add gravity effect
    velocityY += 0.3;
  }
  
  return points;
}

class Bird {
  constructor(x, y, r, img){
    this.body = Bodies.circle(
      x, y, r, {
        restitution: 0.1,
        collisionFilter: {
          category: 2
        }
      }
    );
    Body.setMass(this.body,
      2);
    this.img = img;
    World.add(world,
      this.body); 
  }
  
  show(){
    push();
    if(this.img) {
      imageMode(CENTER);
      translate(
        this.body.position.x,
        this.body.position.y);
      rotate(this.body.angle);
      image(this.img,
        0,0,
        2*this.body.circleRadius,
        2*this.body.circleRadius);
    } else {
    ellipse(this.body.position.x,
      this.body.position.y,
      2*this.body.circleRadius,
      2*this.body.circleRadius);
    }
    pop();
  }
  
  clear(){
    World.remove(world, this.body);
  }
}

class Box {
  constructor(x, y, w, h,
    img, options={}){
      this.body =
        Bodies.rectangle(
        x, y, w, h, options);
      this.w = w;
      this.h = h;
      this.img = img;
      World.add(world,
      this.body);
  }
  getPoints() {
    return this.points;
  }
  show() {
    push();
    translate(this.body.position.x,
         this.body.position.y);
    rotate(this.body.angle);
    
    if(this.img){
      imageMode(CENTER);
      image(this.img,
            0,0,
            this.w, this.h);
    } else {
      rectMode(CENTER);
      rect(0, 0,
           this.w, this.h);      
    }
    pop();
  }
  // Reduce life on impact
  reduceLife(impactForce) {
    this.life -= impactForce;
    if (this.life <= 0) {
      score += this.points; // Add points to the score
      World.remove(world, this.body); // Remove the box from the world
    }
  }
  
}
class Stone extends Box {
  constructor(x,y,w,h,img){
    super(x,y,w,h, img);
  }
}
class Ground extends Box {
  constructor(x,y,w,h,img){
    super(x,y,w,h, img,
      {isStatic: true});
  }
}

class SlingShot {
  constructor(bird) {
    this.sling = Constraint.create({
      pointA: {x: 100, y: height - 80}, // Slingshot position
      bodyB: bird.body,
      stiffness: 0.05,
      length: 0
    });
    
    this.slingshotPosition = {x: 100, y: height - 57};
    this.slingshotWidth = 30; 
    this.slingshotHeight = 75;  
    World.add(world, this.sling);
  }
  
show() {
    if (this.sling.bodyB) {
      const posA = this.sling.pointA;
      const posB = this.sling.bodyB.position;
      
      push();
      strokeWeight(3); 
      stroke(38, 23, 8);
      
      const stretch = ((dist(posA.x, posA.y, posB.x, posB.y) *-0.1 )/ 10)  ;
      strokeWeight(4 / stretch);
      
      line(posA.x - 10, posA.y, posB.x - 10, posB.y);
      line(posA.x + 10, posA.y, posB.x + 10, posB.y);
      pop();
    }
    
    imageMode(CENTER);
    image(slingshotImg, 
          this.slingshotPosition.x,
          this.slingshotPosition.y,
          this.slingshotWidth,
          this.slingshotHeight);
  }
  
  fly(mc){
   if(this.sling.bodyB &&
     mc.mouse.button === -1 &&
     (this.sling.bodyB.position.x >
     this.sling.pointA.x + 10)
     ) {
       this.sling.bodyB.collisionFilter.category = 1;
       this.sling.bodyB = null
   }
  }
  
  attach(bird){
    this.sling.bodyB = bird.body;
  }
}
