const {Engine, World, Bodies, Mouse, MouseConstraint, Body, Constraint, Events} = Matter;

let engine, world, ground, objects = [], boxImg, wood2Img, stoneImg, groundImg;
let birds = [];
let currentBird;
let birdImg = [];

let trajectoryPoints = [];

let pigs = [];
let pigImg;

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
  
    pigImg = loadImage("img/pig.webp");

    // Initialize positions after canvas is created
    waitingPositions = [
        {x: 50, y: height - 20},
        {x: 10, y: height - 20},
        {x: 150, y: height - 70}
    ];
    
    engine = Engine.create();
    world = engine.world;
    
    const mouse = Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    mc = MouseConstraint.create(engine, {
        mouse: mouse,
        collisionFilter: {mask: 2 }
    });
    World.add(world, mc);
    
    ground = new Ground(width/2, height-10, width, 20, groundImg);
    
    createMap();
    createPigs();
  
    createInitialBirds();
  Events.on(engine, 'collisionStart', function(event) {
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Calculamos la fuerza del impacto
        const impactForce = Math.sqrt(
            Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
            Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
        ) * Math.max(bodyA.mass, bodyB.mass);
        
        // Buscamos si alguno de los cuerpos es un cerdo
        const pigA = pigs.find(p => p.body === bodyA);
        const pigB = pigs.find(p => p.body === bodyB);
        const birdA = birds.find(p => p.body === bodyA);        
      const birdB = birds.find(p => p.body === bodyB);
        // Si encontramos un cerdo, reducimos su vida basado en la fuerza del impacto
        if (pigA ) {
            if (pigA.reduceLife(impactForce * 0.5)) {
                pigs = pigs.filter(p => p !== pigA);
            }
        }
        
        if (pigB) {
            if (pigB.reduceLife(impactForce * 0.5)) {
                pigs = pigs.filter(p => p !== pigB);
            }
        }
      
      
        const boxA = objects.find(b => b.body === bodyA);
        const boxB = objects.find(b => b.body === bodyB);
              if (boxA && !pigB && !boxB) {
             boxA.reduceLife(impactForce * 40)
        }
        if (boxB && !birdA  && !boxB) {
            boxB.reduceLife(impactForce * 40)
        }
    });
});
}
function createPigs() {
    // Añadir cerdos en diferentes posiciones
    pigs.push(new Pig(500, height - 235, 12, pigImg));
    pigs.push(new Pig(380, height - 87, 10, pigImg));
    pigs.push(new Pig(500, height - 145, 12, pigImg));
    pigs.push(new Pig(500, height - 87, 9, pigImg));
    pigs.push(new Pig(620, height - 87, 10, pigImg));
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
    let firstBird = new Bird(150, height -70, 11, birdImg[0]);
    birds.push(firstBird);
    currentBird = firstBird;
    
    // Create waiting birds
    for (let i = 0; i < 2; i++) {
        let bird = new Bird(
            waitingPositions[i].x,
            waitingPositions[i].y,
            11,
            birdImg[(i + 1) % birdImg.length]
        );
        birds.push(bird);
    }
    updateWaitingBirds();
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
            x: 150,  // Slingshot x position
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
    for (const pig of pigs) {
        pig.show();
    }
    slingshot.show();
    for (const bird of birds) {
        bird.show();
    }
    
    ground.show();
    push();
    fill(255);
    textSize(24);
    textAlign(RIGHT);
    text(`Score: ${score}`, width - 20, 40);
    pop();
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
          category: 2,
          mask:3
        }
      }
    );
    Body.setMass(this.body,
      4);
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
    img, options={
    collisionFilter: {
          category: 1,mask:3
        }}){
      this.body =
        Bodies.rectangle(
        x, y, w, h, options);
      this.w = w;
      this.h = h;
      this.img = img;
      this.points = 10;
      this.life = 50;
      World.add(world,
      this.body);
  }

  reduceLife(impactForce) {
        const damage = impactForce * 10; // Reducir el daño para hacer el juego más balanceado
        this.life -= damage;
        this.isDamaged = true;
        
        // Efectos visuales adicionales basados en la vida
        if (this.life <= 0) {
            // Aquí podrías agregar efectos de partículas o animación de destrucción
            score += this.points;
            World.remove(world, this.body);
            return true;
        }
        return false;
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
      {isStatic: true,
      collisionFilter: {
          category: 3,
        }});
  }
}
class SlingShot {
    constructor(bird) {
        this.sling = Constraint.create({
          pointA: {x: 150, y: height - 70},
            bodyB: bird.body,
            stiffness: 0.1,
            length: 0
        });
        
        this.slingshotPosition = {x: 150, y: height - 47};
        this.slingshotWidth = 24;
        this.slingshotHeight = 62;
        
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

class Pig {
    constructor(x, y, r, img) {
        this.body = Bodies.circle(x, y, r, {
            restitution: 0.1,
            collisionFilter: {
                category: 1
              
            }
        });
        this.r = r;
        this.img = img;
        this.life = 100;
        this.points = 500;
        this.isDamaged = false;
        
        World.add(world, this.body);
    }
    
    show() {
        push();
        translate(this.body.position.x, this.body.position.y);
        rotate(this.body.angle);
        imageMode(CENTER);
        
        // Aplicar efecto visual cuando el cerdo está dañado
        if (this.isDamaged) {
            tint(255, 0, 0, 200); // Tinte rojo para mostrar daño
            this.isDamaged = false;
        }
        
        // Ajustar el tamaño basado en la vida restante
        const size = map(this.life, 0, 100, this.r * 0.5, this.r * 2);
        image(this.img, 0, 0, size * 2, size * 2);
        
        noTint(); // Resetear el tinte
        pop();
    }
    
    reduceLife(impactForce) {
        const damage = impactForce * 10; // Reducir el daño para hacer el juego más balanceado
        this.life -= damage;
        this.isDamaged = true;
        
        // Efectos visuales adicionales basados en la vida
        if (this.life <= 0) {
            // Aquí podrías agregar efectos de partículas o animación de destrucción
            score += this.points;
            World.remove(world, this.body);
            return true;
        }
        return false;
    }
}