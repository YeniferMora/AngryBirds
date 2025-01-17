const {Engine, World, Bodies, Mouse, MouseConstraint, Body, Constraint, Events} = Matter;

let engine, world, ground, objects = [], boxImg, wood2Img, stoneImg, groundImg;
let birds = [];
let currentBird;
let birdImg = [];

let trajectoryPoints = [];

let score = 0;
let width = 800;
let height = 500;
let slingshot;
let mc;
let backgroundImg, slingshotImg;
let isLaunched = false;
let waitingPositions;

function setup() {
    const canvas = createCanvas(width,height);
    
    // Load images
    boxImg = loadImage("img/wood1.png");
    wood2Img = loadImage("img/wood2.png");
    stoneImg = loadImage("img/stone.png");
    groundImg = loadImage("img/ground3.png");
    backgroundImg = loadImage("img/background2.jpg");
    slingshotImg = loadImage("img/slingshot.png");
    birdImg = [
        loadImage("img/red.png"),
        loadImage("img/yellow.png"),
    ];

    // Initialize positions after canvas is created
    waitingPositions = [
        {x: 50, y: height - 20},
        {x: 10, y: height - 20},
        {x: 100, y: 200}
    ];
    
    engine = Engine.create();
    world = engine.world;
    
    const mouse = Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    mc = MouseConstraint.create(engine, {
        mouse: mouse,
        collisionFilter: {mask: 2}
    });
    World.add(world, mc);
    
    ground = new Ground(width/2, height-10, width, 20, groundImg);
    
    // Create boxes
    createMap();
    
    createInitialBirds();
}
function createMap() {
  objects.push(new Box( 380, height - 40, 40, 40, boxImg));
  objects.push(new Box( 620, height - 40, 40, 40, boxImg));
  objects.push(new Box( 500, height - 40, 40, 40, boxImg));
  objects.push(new Box( 580, height - 50, 150, 10, wood2Img)); 
  objects.push(new Box( 420, height - 50, 150, 10, wood2Img)); 
  objects.push(new Box( 430, height - 90, 40, 40, stoneImg)); 
  objects.push(new Box( 570, height - 90, 40, 40, stoneImg)); 
  objects.push(new Box( 350, height - 90, 10, 40, stoneImg));
  objects.push(new Box( 650, height - 90, 10, 40, stoneImg));
  objects.push(new Box( 500, height - 100, 200, 10, wood2Img));
  objects.push(new Box( 500, height - 100, 200, 10, wood2Img));
  objects.push(new Box( 430, height - 160, 20, 70, stoneImg)); 
  objects.push(new Box( 570, height - 160, 20, 70, stoneImg));
  objects.push(new Box( 500, height - 180, 170, 10, wood2Img));
  objects.push(new Box( 430, height - 220, 40, 40, boxImg)); 
  objects.push(new Box( 570, height - 220, 40, 40, boxImg)); 
}

function createInitialBirds() {
    // First bird in slingshot
    let firstBird = new Bird(100, 200, 15, birdImg[0]);
    birds.push(firstBird);
    currentBird = firstBird;
    
    // Create waiting birds
    for (let i = 0; i < 2; i++) {
        let bird = new Bird(
            waitingPositions[i].x,
            waitingPositions[i].y,
            15,
            birdImg[(i + 1) % birdImg.length]
        );
        birds.push(bird);
    }
    
    slingshot = new SlingShot(currentBird);
}

function isBirdDead() {
    if (!currentBird || !isLaunched) return false;
    
    // Check if bird is off screen with larger margin
    if (currentBird.body.position.x > width + 100 || 
        currentBird.body.position.x < -100 || 
        currentBird.body.position.y > height + 100) {
        return true;
    }
    
    // Check if bird has been still for some time
    const speed = Math.sqrt(
        currentBird.body.velocity.x ** 2 + 
        currentBird.body.velocity.y ** 2
    );
    
    return speed < 0.5 && isLaunched;
}

function nextBird() {
    // Remove current bird
    if (currentBird) {
        World.remove(world, currentBird.body);
        birds = birds.filter(b => b !== currentBird);
    }
    
    // Set up next bird
    if (birds.length > 0) {
        currentBird = birds[0];
        
        Body.setPosition(currentBird.body, {
            x: 100,  // Slingshot x position
            y: 225   // Slingshot y position
        });
        Body.setVelocity(currentBird.body, {x: 0, y: 0});
        Body.setAngularVelocity(currentBird.body, 0);
        slingshot.attach(currentBird);
        isLaunched = false;
    }
}

function updateWaitingBirds() {
    for (let i = birds.length-1; i > 0; i--) {
        let bird = birds[i];
        let targetX = waitingPositions[i-1].x;  
        let targetY = waitingPositions[i-1].y;
        
        // Calcula la posición actual
        let currentX = bird.body.position.x;
        let currentY = bird.body.position.y;
        
        // Interpolación suave (lerp) para mover el pájaro
        let newX = currentX + (targetX - currentX) * 0.02; // Ajusta 0.1 para controlar la velocidad (más pequeño = más lento)
        let newY = currentY - (targetY - currentY) * 0.02;
        
        Body.setPosition(bird.body, {
            x: newX,
            y: newY
        });
        
        // Mantén los pájaros en espera estáticos
        Body.setVelocity(bird.body, {x: 0, y: 0});
        Body.setAngularVelocity(bird.body, 0);
    }
}


function draw() {
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    Engine.update(engine);
    
    if (isBirdDead()) {
        nextBird();
    }
    
    if (!isLaunched) {
        updateWaitingBirds();
    }
        // Update trajectory points only when pulling slingshot
  if (mc.mouse.button === 0 && slingshot.sling.bodyB) {
    trajectoryPoints = calculateTrajectoryPoints(currentBird, slingshot);
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
    for (const bird of birds) {
        bird.show();
    }
    
    ground.show();
}
function keyPressed(){
  if (key== ' ') {
    bird.clear();
    
    const index =
      floor(random(0, birdImg.length));
    
    bird = new Bird(
    100, 200, 15, birdImg[index]);
    slingshot.attach(bird);
  }
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

  reduceLife(impactForce) {
    this.life -= impactForce;
    if (this.life <= 0) {
      score += this.points; // Add points to the score
      World.remove(world, this.body); // Remove the box from the world
    }
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
          pointA: {x: 100, y: height - 80},
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
            
            const stretch = ((dist(posA.x, posA.y, posB.x, posB.y) * -0.1) / 10);
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
    
    fly(mc) {
        if (this.sling.bodyB &&
            mc.mouse.button === -1 &&
            (this.sling.bodyB.position.x > this.sling.pointA.x + 10)
        ) {
            this.sling.bodyB.collisionFilter.category = 1;
            this.sling.bodyB = null;
            isLaunched = true;
        }
    }
    
    attach(bird) {
        this.sling.bodyB = bird.body;
        bird.body.collisionFilter.category = 2;
    }
}