const {Engine, World, Bodies, Mouse, MouseConstraint, Body, Constraint, Events} = Matter;

let bird, birdImg = [], slingshot,
  mc, backgroundImg, slingshotImg;
let engine, world, ground, objects = [], groundImg, starImg;
let birds = [];
let currentBird;

let trajectoryPoints = [];

let pigs = [];
let pigImg;
let score = 0;
let isGameOver = false;
let width = 800;
let height = 500;
let isLaunched = false;
let waitingPositions;

let soundBox;
let soundBirdCollision;
let soundPigCollision;
let soundBirdFlying;

let boxSprites = {
    box: [],
    wood: [],
    stone: [],

  };
const GAME_STATE = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameover'
};

let currentState = GAME_STATE.START;
let finalScore = 0;
let gameStarted = false;
let startButton;
let restartButton;
let levelCompleted = false;

function preload() {
    soundBox = loadSound('sound/wood_collision.wav');  // Sonido para la caja
    soundBirdCollision = loadSound('sound/bird_collision.wav');  // Sonido para el pájaro
    soundPigCollision = loadSound('sound/piglette_collision.wav'); 
    soundBirdFlying = loadSound('sound/bird_flying.wav')
}
function setup() {
    const canvas = createCanvas(width,height);
  
    
    boxSprites.box.push(loadImage("img/wood1.png"));
    boxSprites.stone.push(loadImage("img/stone.png"));
    boxSprites.wood.push(loadImage("img/wood2.png"));
    boxSprites.box.push(loadImage("img/wood_v3.png"));
    boxSprites.stone.push(loadImage("img/stone2.png"));
    boxSprites.wood.push(loadImage("img/wood2_v2.png"));
    groundImg = loadImage("img/ground3.png");
    backgroundImg = loadImage("img/background2.jpg");
    splashImg = loadImage("img/splashScreen.png");
    slingshotImg = loadImage("img/slingshot.png");
    birdImg = [
        loadImage("img/red.png"),
        loadImage("img/yellow.png"),
    ];
  
    pigImg = loadImage("img/pig.webp");
    starImg = loadImage("img/star.png");

    deadBirdImg = loadImage("img/deadBird.png");
    damagedPigImg = loadImage("img/damagedPig.png");
    veryDamagedPigImg = loadImage("img/veryDamagedPig.png");
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
        collisionFilter: {mask: 2}
    });
  
    startButton = createButton('Start Game');
    startButton.position(width/2 -70 , height/2 + 150)
    startButton.mousePressed(startGame);
    startButton.class('game-button');
    
    restartButton = createButton('Play Again');
    restartButton.position(width/2 - 55, height/2 + 120);
    restartButton.mousePressed(restartGame);
    restartButton.class('game-button');
    restartButton.hide();

    // Inicialmente ocultar el mundo del juego
    World.clear(world);
    Engine.clear(engine);
    
}


// Agregar las funciones de control de estado
function startGame() {
  
    console.log('startGame function called');
    currentState = GAME_STATE.PLAYING;
    startButton.hide();
    gameStarted = true;
    score = 0;
  
    // Inicializar el mundo del juego
    setupGameWorld();
}

function getStarsForScore(score) {
    if (score > 2000) return 3;
    if (score > 1000) return 2;
    return 1;
}

function setupGameWorld() {
    // Código original de inicialización
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
                soundPigCollision.play()
                if (pigA.reduceLife(impactForce * 0.7)) {
                    pigs = pigs.filter(p => p !== pigA);
                }
            }
            
            if (pigB  ) {
                soundPigCollision.play()
                if (pigB.reduceLife(impactForce * 0.7)) {
                    pigs = pigs.filter(p => p !== pigB);
                }
            }
            
            
            const boxA = objects.find(b => b.body === bodyA);
            const boxB = objects.find(b => b.body === bodyB);
            if (boxA  && !boxB) {
                soundBox.play();  
                boxA.reduceLife(impactForce *2)
            }
            if (boxB && (birdA || birdB)) {
                soundBox.play();  
                boxB.reduceLife(impactForce *2)
            }
            if(birdA || birdB){
                soundBirdCollision.play()
            }

        });
    });
    
  
}



function restartGame() {
    // Limpiar el mundo
    World.clear(world);
    Engine.clear(engine);
    
    // Reiniciar variables
    objects = [];
    birds = [];
    pigs = [];
    score = 0;
    currentState = GAME_STATE.PLAYING;
    levelCompleted = false;
    restartButton.hide();
    
    // Reinicializar el mundo
    setupGameWorld();
}

function checkGameOver() {
    // Verificar si se acabaron los pájaros y hay cerdos vivos
    if (birds.length === 0 && pigs.length > 0) {
        currentState = GAME_STATE.GAME_OVER;
        finalScore = score;
        restartButton.show();
        levelCompleted = false;
    }
    // Verificar si se eliminaron todos los cerdos
    else if (pigs.length === 0) {
        currentState = GAME_STATE.GAME_OVER;
        finalScore = score;
        restartButton.show();
        levelCompleted = true;
    }
}

// Modificar la función draw()
function draw() {
    switch(currentState) {
        case GAME_STATE.START:
            drawStartScreen();
            break;
        case GAME_STATE.PLAYING:
            drawGameScreen();
            checkGameOver();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverScreen();
            break;
    }
}




function drawStartScreen() {
    push();
    background(splashImg);
    pop();
}

function drawGameScreen() {
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    Engine.update(engine);

    if (isBirdDead()) {
      
        nextBird();
    }

    if (!isLaunched) {
        updateWaitingBirds();
    }

    // Dibujar puntos de trayectoria
    if (mc.mouse.button === 0 && slingshot.sling.bodyB) {
        trajectoryPoints = calculateTrajectoryPoints(currentBird, slingshot);
    } else if (!slingshot.sling.bodyB) {
        trajectoryPoints = [];
    }

    push();
    fill(255);
    noStroke();
    for (let point of trajectoryPoints) {
        ellipse(point.x, point.y, 4, 4);
    }
    pop();

    // Mostrar elementos del juego
    slingshot.fly(mc);
    for (const box of objects) box.show();
    for (const pig of pigs) pig.show();
    slingshot.show();
    for (const bird of birds) bird.show();
    ground.show();

    // Mostrar score y pájaros restantes
    displayScoreAndStars(score)
}

function displayScoreAndStars(score) {
  const stars = getStarsForScore(score);
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

function drawGameOverScreen() {
    push();
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);

    if (levelCompleted) {
        text('Level Complete!', width / 2, height / 3);
      
        // Mostrar estrellas según la puntuación
        const stars = getStarsForScore(finalScore);
        let starX = width / 2 - 50;
        for (let i = 0; i < stars; i++) {
            image(starImg, starX + i * 60, height / 2 + 40, 40, 40);  // Asegúrate de cargar la imagen de la estrella
        }
    } else {
        text('Game Over', width / 2, height / 3);
    }

    textSize(32);
    text(`Final Score: ${finalScore}`, width / 2, height / 2);


    pop();
}


// Agregar estilos CSS al documento HTML
const styles = document.createElement('style');
styles.textContent = `
    .game-button {
        padding: 10px 20px;
        font-size: 18px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .game-button:hover {
        background-color: #45a049;
    }
`;
document.head.appendChild(styles);




function createPigs() {
    // Añadir cerdos en diferentes posiciones
    pigs.push(new Pig(500, height - 235, 12, pigImg));
    pigs.push(new Pig(380, height - 87, 10, pigImg));
    pigs.push(new Pig(500, height - 145, 12, pigImg));
    pigs.push(new Pig(500, height - 87, 9, pigImg));
    pigs.push(new Pig(620, height - 87, 10, pigImg));
}

function createMap() {
  objects= [];
  objects.push(new Box( 380, height - 40, 40, 40,'box'));
  objects.push(new Box( 620, height - 40, 40, 40, 'box'));
  objects.push(new Box( 500, height - 40, 40, 40, 'box'));
  objects.push(new Box( 580, height - 50, 150, 10, 'wood')); 
  objects.push(new Box( 420, height - 50, 150, 10, 'wood')); 

  objects.push(new Box( 430, height - 90, 40, 40, 'stone')); 
  objects.push(new Box( 570, height - 90, 40, 40, 'stone')); 
  objects.push(new Box( 350, height - 90, 10, 40, 'stone'));
  objects.push(new Box( 650, height - 90, 10, 40, 'stone'));

  objects.push(new Box( 500, height - 100, 200, 10, 'wood'));
  objects.push(new Box( 500, height - 100, 200, 10, 'wood'));

  objects.push(new Box( 430, height - 160, 20, 70, 'stone')); 
  objects.push(new Box( 570, height - 160, 20, 70, 'stone'));

  objects.push(new Box( 500, height - 180, 170, 10, 'wood'));
  objects.push(new Box( 430, height - 220, 40, 40, 'box')); 
  objects.push(new Box( 570, height - 220, 40, 40, 'box')); 
  
}

function createInitialBirds() {
    console.log("hey");
    // First bird in slingshot
    let firstBird = new Bird(150, height -70, 14, birdImg[0]);
    birds.push(firstBird);
    console.log("Birds push: ");
    console.log(birds);
    currentBird = firstBird;
    
    // Create waiting birds
    for (let i = 0; i < 2; i++) {
        let bird = new Bird(
            waitingPositions[i].x,
            waitingPositions[i].y,
            14,
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
  constructor(x, y, r, img) {
    this.body = Bodies.circle(x, y, r, {
      restitution: 0.1,
      collisionFilter: {
        category: 2,
        mask: 3
      }
    });
    Body.setMass(this.body, 4);
    this.normalImg = img;
    this.deadImg = loadImage("img/deadBird.png"); // Necesitarás crear esta imagen
    this.r = r;
    this.isDying = false;
    this.deathFrame = 0;
    this.maxDeathFrames = 15;
    World.add(world, this.body);
  }

  show() {
    push();
    imageMode(CENTER);
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    if (this.isDying) {
      this.deathFrame++;
      // Usar imagen de pájaro muerto
      image(this.deadImg, 0, 0, 2 * this.r, 2 * this.r);
      if (this.deathFrame >= this.maxDeathFrames) {
        this.clear();
      }
    } else {
      image(this.normalImg, 0, 0, 2 * this.r, 2 * this.r);
    }
    pop();
  }

  die() {
    this.isDying = true;
  }

  clear() {
    die();
    World.remove(world, this.body);
  }
}

class Box {
  constructor(x, y, w, h,
    type, img, options={
        collisionFilter: {
          category: 1,
          mask: 2 | 3
        }
    })
    {
      this.body =
        Bodies.rectangle(
        x, y, w, h, options);
      this.w = w;
      this.h = h;
      this.type = type;
      this.img = img;
      this.points = 10;
      this.life = 100;
      this.spriteIndex = 0; // Índice del sprite actual
      World.add(world,
      this.body);
  }

  reduceLife(impactForce) {
        const damage = impactForce; // Reducir el daño para hacer el juego más balanceado
        this.life -= damage;
        this.isDamaged = true;
        if (this.life <=50){
            this.spriteIndex++;
        }
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
    let imgSprite = this.type ? boxSprites[this.type][this.spriteIndex] : this.img
    if(imgSprite && this.life>0 ){
        imageMode(CENTER);
        image(imgSprite,
            0,0,
            this.w, this.h);
    }
    pop();
  }
  
}
class Ground extends Box {
  constructor(x,y,w,h,img){
    super(x,y,w,h,'', img,
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
            soundBirdFlying.play()
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
    this.body = Bodies.circle(x, y, 1.9*r, {
      restitution: 0.1,
      collisionFilter: {
        category: 1
      }
    });
    this.r = r;
    this.normalImg = img;
    // Cargar imágenes para diferentes estados de daño
    this.damagedImg = loadImage("img/damagedPig.png"); // Cerdo con daño medio
    this.veryDamagedImg = loadImage("img/veryDamagedPig.png"); // Cerdo muy dañado
    this.life = 100;
    this.points = 500;
    World.add(world, this.body);
  }

  show() {
    push();
    imageMode(CENTER);
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    // Seleccionar la imagen basada en la vida
    let currentImg;
    if (this.life > 70) {
      currentImg = this.normalImg;
    } else if (this.life > 30) {
      currentImg = this.damagedImg;
    } else {
      currentImg = this.veryDamagedImg;
    }

    image(currentImg, 0, 0, 4 * this.r, 4 * this.r);
    pop();
  }

  reduceLife(impactForce) {
    const damage = impactForce * 3;
    this.life -= damage;

    if (this.life <= 0) {
      score += this.points;
      World.remove(world, this.body);
      return true;
    }
    return false;
  }
}
