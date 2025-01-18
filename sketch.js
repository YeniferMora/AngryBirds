const {Engine, World, Bodies, Mouse, MouseConstraint, Body, Constraint, Events, Render} = Matter;

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
let width = 1200; // Aumentado de 800
let height = 600; // Aumentado de 500
let isLaunched = false;
let waitingPositions;

let soundBox;
let soundBirdCollision;
let soundPigCollision;
let soundBirdFlying;
let activeSounds = {};
let floatingScores = [];
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
let starAnimations = [];
let restartIcon;
let startIcon;

function preload() {
    soundBox = loadSound('sound/wood_collision.wav');  // Sonido para la caja
    soundBirdCollision = loadSound('sound/bird_collision.wav');  // Sonido para el pájaro
    soundPigCollision = loadSound('sound/piglette_collision.wav'); 
    soundBirdFlying = loadSound('sound/bird_flying.wav'); 
    restartIcon = loadImage("img/restart.png");
    startIcon = loadImage("img/start.png");
    splashImg = loadImage("img/splashScreen.png");
  
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
    {x: 140, y: height - 20},  // Ajustado desde 50
    {x: 80, y: height - 20},  // Ajustado desde 10
    {x: 250, y: height - 170}  // Ajustado desde 150
];
    
    floatingScores = [];
    engine = Engine.create();
    world = engine.world;
    
    const mouse = Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    mc = MouseConstraint.create(engine, {
        mouse: mouse,
        collisionFilter: {mask: 2}
    });
  
  
    // Inicialmente ocultar el mundo del juego
    World.clear(world);
    Engine.clear(engine);
    
}
function mousePressed() {
        const buttonSize = 80;
        const panelHeight = 400;
        const panelY = height/2 - panelHeight/2;
        const buttonY = panelY + 320;
    if (currentState === GAME_STATE.GAME_OVER) {
        
        if (dist(mouseX, mouseY, width/2, buttonY) < buttonSize/2) {
            starAnimations = [];
            restartGame();
        }
    }
    else if (currentState === GAME_STATE.START) {
      if (dist(mouseX, mouseY, width/2, 500) < buttonSize/2) {
            startGame();
        }
        
    }
  
}
// Agregar las funciones de control de estado
function startGame() {
  
    currentState = GAME_STATE.PLAYING;
    gameStarted = true;
    score = 0;
  
    // Inicializar el mundo del juego
    setupGameWorld();
}

function getStarsForScore(score) {
    if (score > 2500) return 3;
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
                playSound('pigCollision', soundPigCollision);
                if (pigA.reduceLife(impactForce * 0.7)) {
                    pigs = pigs.filter(p => p !== pigA);
                }
            }
            
            if (pigB  ) {
                playSound('pigCollision', soundPigCollision);
                if (pigB.reduceLife(impactForce * 0.7)) {
                    pigs = pigs.filter(p => p !== pigB);
                }
            }
            
            
            const boxA = objects.find(b => b.body === bodyA);
            const boxB = objects.find(b => b.body === bodyB);
            if (boxA  && !boxB) {
                playSound('boxCollision', soundBox);
                boxA.reduceLife(impactForce *2)
            }
            if (boxB && (birdA || birdB)) {
                playSound('boxCollision', soundBox);
                boxB.reduceLife(impactForce *2)
            }
            if(birdA || birdB){
                playSound('birdCollision', soundBirdCollision);
            }

        });
    });
    
  
}


function playSound(soundId, sound) {
    if (!activeSounds[soundId]) {
        sound.play();
        activeSounds[soundId] = true;

        sound.onended(() => {
            activeSounds[soundId] = false;
        });
    }
}

function restartGame() {
    // Limpiar el mundo físico
    World.clear(world);
    Engine.clear(engine);
    
    // Limpiar todas las referencias y variables
    objects = [];
    birds = [];
    pigs = [];
    score = 0;
    currentBird = null;  // Añadir esta línea
    isLaunched = false;  // Añadir esta línea
    currentState = GAME_STATE.PLAYING;
    levelCompleted = false;
    
    floatingScores = [];
    // Reinicializar el mundo
    setupGameWorld();
}

function checkGameOver() {
    // Verificar si se acabaron los pájaros y hay cerdos vivos
    if (birds.length === 0 && pigs.length > 0) {
        currentState = GAME_STATE.GAME_OVER;
        finalScore = score;
        levelCompleted = false;
    }
    // Verificar si se eliminaron todos los cerdos
    else if (pigs.length === 0) {
        currentState = GAME_STATE.GAME_OVER;
        finalScore = score;
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
  
    drawRestartButton(width/2,  520, startIcon );
    pop();
}

function drawGameScreen() {
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    Engine.update(engine);

    // Verificar si el pájaro actual está muerto
    isBirdDead();

    // Solo llamar a nextBird si la animación de muerte ha terminado
    if (currentBird && currentBird.isDying && currentBird.deathFrame >= currentBird.maxDeathFrames) {
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
        floatingScores = floatingScores.filter(score => {
        score.show();
        return score.update();
    });
    push();
    fill(255);
    noStroke();
    for (let point of trajectoryPoints) {
        ellipse(point.x, point.y, 4, 4);
    }
    pop();

    // Mostrar elementos del juego
    slingshot.fly(mc);
    for (const box of objects) {
        if (box.life > 0) {
            box.show();
        }
    }
    for (const pig of pigs) pig.show();
    slingshot.show();
    for (const bird of birds) bird.show();
    ground.show();

    // Mostrar score y pájaros restantes
    displayScoreAndStars(score);
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
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    Engine.update(engine);

    // Panel central con fondo azul claro semitransparente
    const panelWidth = 500;
    const panelHeight = 400;
    const panelX = width/2 - panelWidth/2;
    const panelY = height/2 - panelHeight/2;
    
    // Sombra del panel
    fill(0, 20);
    noStroke();
    rect(panelX + 5, panelY + 5, panelWidth, panelHeight, 20);
    
    // Panel principal
    fill(135, 206, 235, 200); // Azul claro semitransparente
    stroke(255, 100);
    strokeWeight(2);
    rect(panelX, panelY, panelWidth, panelHeight, 20);
    
    // Título
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);
    noStroke();
    if (levelCompleted) {
        text('Level Complete!', width/2, panelY + 80);
        
        // Inicializar animaciones de estrellas si es necesario
        if (starAnimations.length === 0) {
            const stars = getStarsForScore(finalScore);
            const starY = panelY + 180;
            const spacing = 100; // Más espacio entre estrellas
            
            for (let i = 0; i < stars; i++) {
                const starX = width/2 - 20 + (i - Math.floor(stars/2)) * spacing;
                starAnimations.push(new StarAnimation(starX, starY, i * 10));
            }
        }
        
        // Actualizar y mostrar animaciones de estrellas
        starAnimations.forEach(star => {
            star.update();
            star.show();
        });
    } else {
        text('Game Over', width/2, panelY + 80);
    }

    // Puntuación
    textSize(32);
    fill(255);
    text(`Final Score: ${finalScore}`, width/2, panelY + 150);

    // Botón de reinicio más grande
    drawRestartButton(width/2, panelY + 320, restartIcon );
    
    pop();
}

function drawRestartButton(x, y, img) {
    const buttonSize = 80; // Botón más grande
    
    push();
    // Sombra del botón
    fill(0, 100);
    noStroke();
    ellipse(x + 2, y + 2, buttonSize + 4);
    
    // Fondo del botón
    fill(76, 175, 80); // Verde material design
    stroke(255, 50);
    strokeWeight(2);
    ellipse(x, y, buttonSize);
    
    // Efecto hover
    if (dist(mouseX, mouseY, x, y) < buttonSize/2) {
        fill(255, 50);
        ellipse(x, y, buttonSize);
        cursor(HAND);
    } else {
        cursor(ARROW);
    }
    
    // Ícono de reinicio
    imageMode(CENTER);
    tint(255);
    image(img, x, y, buttonSize, buttonSize);
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
    // Mover los cerdos más a la derecha
    pigs.push(new Pig(800, height - 235, 12, pigImg));      // Cerdo superior
    pigs.push(new Pig(680, height - 87, 10, pigImg));       // Cerdo inferior izquierdo
    pigs.push(new Pig(800, height - 145, 12, pigImg));      // Cerdo medio
    pigs.push(new Pig(800, height - 87, 9, pigImg));        // Cerdo inferior centro
    pigs.push(new Pig(920, height - 87, 10, pigImg));       // Cerdo inferior derecho
}

function createMap() {
    objects = [];
    // Primera fila (base)
    objects.push(new Box(680, height - 40, 40, 40, 'box'));
    objects.push(new Box(920, height - 40, 40, 40, 'box'));
    objects.push(new Box(800, height - 40, 40, 40, 'box'));
    
    // Vigas de madera horizontales inferiores
    objects.push(new Box(880, height - 50, 150, 10, 'wood')); 
    objects.push(new Box(720, height - 50, 150, 10, 'wood')); 

    // Segunda fila (piedras)
    objects.push(new Box(730, height - 90, 40, 40, 'stone')); 
    objects.push(new Box(870, height - 90, 40, 40, 'stone')); 
    objects.push(new Box(650, height - 90, 10, 40, 'stone'));
    objects.push(new Box(950, height - 90, 10, 40, 'stone'));

    // Viga de madera horizontal media
    objects.push(new Box(800, height - 100, 200, 10, 'wood'));
    objects.push(new Box(800, height - 100, 200, 10, 'wood'));

    // Columnas de piedra
    objects.push(new Box(730, height - 160, 20, 70, 'stone')); 
    objects.push(new Box(870, height - 160, 20, 70, 'stone'));

    // Viga superior
    objects.push(new Box(800, height - 180, 170, 10, 'wood'));
    
    // Cajas superiores
    objects.push(new Box(730, height - 220, 40, 40, 'box')); 
    objects.push(new Box(870, height - 220, 40, 40, 'box')); 
}

function createInitialBirds() {
    // Limpiar el array de pájaros por si acaso
    birds = [];
    
    // Crear el primer pájaro para el slingshot
    let firstBird = new Bird(250, height - 70, 14, birdImg[0]);
    birds.push(firstBird);
    currentBird = firstBird;

    // Crear los dos pájaros en espera
    let bird2 = new Bird(50, height - 20, 14, birdImg[1]);
    let bird3 = new Bird(10, height - 20, 14, birdImg[0]);
    
    birds.push(bird2);
    birds.push(bird3);

    // Inicializar el slingshot y actualizar posiciones
    slingshot = new SlingShot(currentBird);
    updateWaitingBirds();
}


function isBirdDead() {
    if (!currentBird || !isLaunched || currentBird.isDying) return false;
    
    // Check if bird is off screen with larger margin
    if (currentBird.body.position.x > width + 100 || 
        currentBird.body.position.x < -100 || 
        currentBird.body.position.y > height + 100) {
        currentBird.die();
        return false; // Cambiado a false para que nextBird() no se llame inmediatamente
    }
    
    // Check if bird has been still for some time
    const speed = Math.sqrt(
        currentBird.body.velocity.x ** 2 + 
        currentBird.body.velocity.y ** 2
    );
    
    if (speed < 0.5 && isLaunched) {
        currentBird.die();
        return false; // Cambiado a false para que nextBird() no se llame inmediatamente
    }
    
    return false;
}

function nextBird() {
    // Solo cambiamos al siguiente pájaro si el actual ha completado su animación de muerte
    if (currentBird && (!currentBird.isDying || currentBird.deathFrame >= currentBird.maxDeathFrames)) {
        // Remove current bird from world and array
        if (currentBird) {
            World.remove(world, currentBird.body);
            birds = birds.filter(b => b !== currentBird);
        }
        
        // Set up next bird
        if (birds.length > 0) {
            currentBird = birds[0];
            
            Body.setPosition(currentBird.body, {
                x: 250,  // Slingshot x position
                y: height - 70   // Slingshot y position
            });
            Body.setVelocity(currentBird.body, {x: 0, y: 0});
            Body.setAngularVelocity(currentBird.body, 0);
            slingshot.attach(currentBird);
            isLaunched = false;
        }
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
    // Asegurarse de que deadBirdImg esté definido como variable global
    this.deadImg = deadBirdImg; // Imagen del pájaro muerto
    this.r = r;
    this.isDying = false;
    this.deathFrame = 0;
    this.maxDeathFrames = 30;
    this.originalPosition = null;
    this.opacity = 255;
    World.add(world, this.body);
  }

  show() {
    push();
    imageMode(CENTER);
    translate(this.body.position.x, this.body.position.y);
    rotate(this.body.angle);

    if (this.isDying) {
      if (!this.originalPosition) {
        this.originalPosition = {
          x: this.body.position.x,
          y: this.body.position.y,
          angle: this.body.angle
        };
      }

      // Calcula la opacidad
      this.opacity = map(this.deathFrame, 0, this.maxDeathFrames, 255, 0);
      
      // Aplica la transparencia
      tint(255, this.opacity);

      // Asegúrate de que la imagen esté cargada antes de mostrarla
      if (this.deadImg) {
        image(this.deadImg, 0, 0, 2.5 * this.r, 2.5 * this.r); // Aumenté ligeramente el tamaño
      }
      
      this.deathFrame++;
      
      if (this.deathFrame >= this.maxDeathFrames) {
        this.remove();
      }
    } else {
      image(this.normalImg, 0, 0, 2 * this.r, 2 * this.r);
    }
    pop();
  }

  die() {
    if (!this.isDying) {
      this.isDying = true;
      this.deathFrame = 0;
      // Mantener la posición actual cuando muere
      Body.setStatic(this.body, true);
    }
  }

  remove() {
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
        const damage = impactForce;
        this.life -= damage;
        this.isDamaged = true;
        if (this.life <= 50) {
            this.spriteIndex = 1;
        }
        if (this.life <= 0) {
            score += this.points;
            // Crear un nuevo punto flotante
            floatingScores.push(new FloatingScore(
                this.body.position.x,
                this.body.position.y,
                this.points
            ));
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
          pointA: {x: 250, y: height - 70},
            bodyB: bird.body,
            stiffness: 0.1,
            length: 0
        });
        
        this.slingshotPosition = {x: 250, y: height - 47};
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
        this.damagedImg = loadImage("img/damagedPig.png");
        this.veryDamagedImg = loadImage("img/veryDamagedPig.png");
        this.life = 100;
        this.points = 500;
        World.add(world, this.body);
    }

    reduceLife(impactForce) {
        const damage = impactForce * 3;
        this.life -= damage;

        if (this.life <= 0) {
            score += this.points;
            // Crear un nuevo punto flotante
            floatingScores.push(new FloatingScore(
                this.body.position.x,
                this.body.position.y,
                this.points
            ));
            World.remove(world, this.body);
            return true;
        }
        return false;
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
}


class StarAnimation {
    constructor(x, y, delay) {
        this.x = x;
        this.y = y;
        this.scale = 0;
        this.opacity = 0;
        this.delay = delay;
        this.active = false;
        this.rotation = 0;
        this.finalScale = 1.2; // Estrellas más grandes
    }

    update() {
        if (this.delay > 0) {
            this.delay--;
            return;
        }
        
        if (!this.active) {
            this.active = true;
        }

        if (this.scale < this.finalScale) {
            this.scale += 0.15;
        }
        
        if (this.opacity < 255) {
            this.opacity += 25;
        }
        
        //this.rotation += 0.1;
    }

    show() {
        if (!this.active) return;
        
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        tint(255, this.opacity);
        image(starImg, 0, 0, 60 * this.scale, 60 * this.scale); // Estrellas más grandes (60px)
        pop();
    }
}

class FloatingScore {
    constructor(x, y, points) {
        this.x = x;
        this.y = y;
        this.points = points;
        this.opacity = 255;
        this.lifetime = 60; // Duración en frames
        this.velocity = -2; // Velocidad de ascenso
    }

    update() {
        this.y += this.velocity;
        this.opacity -= 255 / this.lifetime;
        this.lifetime--;
        return this.lifetime > 0;
    }

    show() {
        push();
        textAlign(CENTER);
        textSize(20);
        fill(255, 255, 255, this.opacity);
        stroke(0, 0, 0, this.opacity);
        strokeWeight(2);
        text(`+${this.points}`, this.x, this.y);
        pop();
    }
}
