var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var mouseDown;
var mouseX;
var mouseY;
var init_size = true;
var keys = {};
var idles = ['idle', 'idleBackAndForth', 'idleBreathing', 'idleFall', 'idleLayDown', 'idleLookAround', 'idleLookDown', 'idleLookLeft', 'idleLookRight', 'idleLookUp', 'idleSit', 'idleSpin', 'idleWave'];
var alreadyIdle = false;
var distThresh = 55; 
const sprites = [];

var bufferedCanvas = document.createElement('canvas');
bufferedCanvas.width = window.innerWidth;
bufferedCanvas.height = window.innerHeight;
//var bufferedContext = bufferedCanvas.getContext('2d');

const JSON_WAITING_TIME = 100, SPRITE_WAITING_TIME = 1000;
var animData;
var animations = [];
var dataLoaded = false;
fetch('../data/animationData.json')
    .then(function(response) {
        if (response.ok)
            return response.json();
        else
            console.log("Error loading JSON!")
    })
    .then(animData  => { // Wait for JSON to load then load anims
        for (const [key, value] of Object.entries(animData['TenderBud'])) {
            let animArr = [];
            for (let i = 0; i < animData['TenderBud'][key].length; i++) {
                let img = new Image();
                img.src = "../assets/images/TenderBud/" + key + "/" + i.toString() + '.png';
                animArr.push(img);
            }
            
            animations.push(animArr);
        }    
        dataLoaded = true;
        start();
    });

    // Wait for data to load then wait five seconds before penguins begin walking
function start() {
    if (!dataLoaded) {
        setTimeout(start, JSON_WAITING_TIME);
        return;
    }
    // Wait five seconds
    setTimeout(function() {
        for (let j = 0; j < sprites.length; j++) {
            sprites[j].randomDirection();
        }
    }, SPRITE_WAITING_TIME);
}

function getIdleAnimation() {
    let numb = Math.floor(Math.random() * 2);
    let idleAnim = idles[1];
    return idleAnim;
}

// sqrt(a^2) + sqrt(b^2) = sqrt(y^2)
function dist(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0],2)) + Math.sqrt(Math.pow(a[1] - b[1],2));
}

context.fillStyle = "blue";
context.fillRect(0, 0, canvas.clientWidth, canvas.height);


// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);
                  function resizeCanvas() {
                          canvas.width = window.innerWidth;
                          canvas.height = window.innerHeight;
                          if(init_size){
                              init_size = false;
                              return;
                          }
                  }

resizeCanvas();

const states = new Map([
    ['idle', 0],
    ['idleLookRight', 1],
    ['idleSit', 2],
    ['walk_N', 3],
    ['idleLookAround', 4],
    ['idleLookDown', 5],
    ['walk_S', 6],
    ['walk_SW', 7],
    ['walk_SE', 8],
    ['idleBackAndForth', 9],
    ['idleBreathing', 10],
    ['idleSpin', 11],
    ['walk_NW', 12],
    ['walk_NE', 13],
    ['idleLayDown', 14],
    ['idleLookUp', 15],
    ['idleLookLeft', 16],
    ['idleFall', 17],
    ['walk_E', 18],
    ['walk_W', 19],
    ['idleWave', 20],
]);

// A penguin sprite has: Width, height, (x,y) position, idle relative path, time_delta
class Sprite {
    constructor(x, y, timeDelta, h, w, startSpeed, perception) {
        this.x_y = [Math.random() * canvas.width, Math.random() * canvas.height];
        this.h_w = [h,w];
        this.perception = perception;
        this.startSpeed = startSpeed;

        
        this.acceleration = [0,0];
        this.velocity = [0,0];

        this.timeDelta = timeDelta;
        this.lastAnimTime = new Date().getTime();
        this.state = getIdleAnimation();
        this.animState = 0;
        this.bgIMG = null;
    }

    randomDirection () {
        let theta = Math.random() * 2 * Math.PI; // startingSpeed=1, theta=(0-1) * 2pi
        this.velocity = [Math.cos(theta) * this.startSpeed, Math.sin(theta) * this.startSpeed]; // calculate x,y given angle & startingSpeed
    }

    draw(){
        if ((this.timeDelta + this.lastAnimTime) > new Date().getTime())
            return;
        this.lastAnimTime =  new Date().getTime();
        
        //this.bgIMG = context.getImageData(this.x_y[0], this.x_y[1], this.h_w[1], this.h_w[0]);
        //if (this.bgIMG != null)
          //  context.putImageData(this.bgIMG, this.x_y[0], this.x_y[1]);        
        //context.clearRect(this.x_y[0], this.x_y[1], this.h_w[1]*1.2, this.h_w[0]*1.2);
        //bufferedContext.clearRect(this.x_y[0], this.x_y[1], this.h_w[1], this.h_w[0]);

        // bug here, undef
        try {
            if (this.animState > animations[states.get(this.state)].length)
                this.animState = 0;
            let img = animations[states.get(this.state)][this.animState];
            this.animState = (this.animState + 1) % animations[states.get(this.state)].length;
            context.drawImage(img, this.x_y[0], this.x_y[1], this.h_w[1], this.h_w[0]);
        } catch (error) {
            console.log(error + " state: " + this.state);
        }
    }

    // Determine the animation/state based on the current velocity vector
    getMovementDirection(futurePos) {
        let relX = futurePos[0] - this.x_y[0];
        let relY = futurePos[1] - this.x_y[1];

        let facingDirection = Math.atan2(-relY, relX) * (180/Math.PI);

        // Slices (45deg ea): 337.5 and 22.5  E 22.5 and 67.5   NE 67.5 and 112.5  N 112.5 and 157.5 NW 157.5 and 202.5 W 202 and 247.5   SW 247.5 and 292.5 S 292.5 and 337.5 SE
        if ((facingDirection >= 337.5 && facingDirection <= 360 )|| facingDirection >= 0 && facingDirection <= 22.5) {
            return "walk_E";
        }
        else if ((facingDirection >= 22.5 && facingDirection <= 67.5 )) {
            return "walk_NE";
        }
        else if ((facingDirection >= 67.5 && facingDirection <= 112.5 )) {
            return "walk_N";
        }
        else if ((facingDirection >= 112.5 && facingDirection <= 157.5 )) {
            return "walk_NW";
        }
        else if ((facingDirection >= 157.5 && facingDirection <= 202.5 )) {
            return "walk_W";
        }
        else if ((facingDirection >= 202.5 && facingDirection <= 247.5 )) {
            return "walk_SW";
        }
        else if ((facingDirection >= 247.5 && facingDirection <= 292.5 )) {
            return "walk_S";
        }
        else if ((facingDirection >= 292.5 && facingDirection <= 337.5 )) {
            return "walk_SE";
        }
        else {
            return getIdleAnimation();
        }
    }

    move() {
        // Check if future movement puts sprite outside of playground
        const canvasBox = canvas.getBoundingClientRect();
        let x = this.x_y[0] + this.velocity[0];
        let y = this.x_y[1] + this.velocity[1];
        if (x > (canvasBox.left + canvasBox.width - this.h_w[1]) || y < canvasBox.top || x < canvasBox.left || y > (canvasBox.top + canvasBox.height - this.h_w[0]*1.5)) // check if exited bounds, check if penguin 
            return;
        
        this.state = this.getMovementDirection([x,y]);
        // Set pos
        this.x_y[0] = x;
        this.x_y[1] = y;
        // Set velocity
        this.velocity[this.velocity[0] + this.acceleration[0], this.velocity[1] + this.acceleration[1]];
    }

    // Align with the other boids velocity if they're within perception
    align(boids) {
        let avgVelocity = [0,0];
        let nearbyBoids = 0;
        for (let i = 0; i < boids.length; i++) {
            if (boids[i] != this && dist(this.x_y, boids[i].x_y) < this.perception) {
                nearbyBoids++;
                avgVelocity[0] += boids[i].velocity[0]
                avgVelocity[1] += boids[i].velocity[1]
            }
        }
        if (nearbyBoids > 0) {
            avgVelocity[0] /= nearbyBoids;
            avgVelocity[1] /= nearbyBoids;
            avgVelocity[0] -= this.velocity[0];
            avgVelocity[1] -= this.velocity[1];
            return avgVelocity;
        }
        return [0,0];
    }

    flock(boids) {
        let aln = this.align(boids);
        this.velocity[0] += aln[0]; 
        this.velocity[1] += aln[1]; 
    }
    
    // notes for keeping Sprites track of shared resources, spirite[] array, score, boundaries. Threads need to check & update the shared resource!
    
    canvas_resize() {
        // redo this
        //this.width = canvas.width * this.widthScale;
        //this.height = canvas.height * this.heightScale;
        //this.x_speed = this.x_speedFactor * canvas.width;
        //this.y_speed = this.y_speedFactor * canvas.height;
    }
}

// Handlers
window.addEventListener('resize', resizeCanvas, false);
                    function resizeCanvas() {
                            canvas.width = window.innerWidth;
                            canvas.height = window.innerHeight;

                            if(init_size){
                                init_size = false;
                                return;
                            }
                            
                            // call on sprites array & get them to a size comp to canva
                            for(let i=0; i < sprites.length; i++){
                                sprites[i].canvas_resize();
                            }
                    }

// Main
let howManyPenguins = 100;
for (let j = 0; j < howManyPenguins; j++) {
    let penguin = new Sprite(canvas.width/2, canvas.height/2, 2, 50, 50, 1, 50);
    sprites.push(penguin);
}
start();
resizeCanvas();
call_me_on_draw();

// World view - the world can be affected by Sprites on it, projecting shadow/shading. Paraellel, not sequestrial.

function call_me_on_draw(){
    context.clearRect(0, 0, canvas.width, canvas.height);   
    
    for (let i = 0; i < sprites.length; i++) {
        sprites[i].draw();
        sprites[i].flock(sprites);
        sprites[i].move();
    }
    window.requestAnimationFrame(call_me_on_draw.bind(this));
    //context.drawImage(canvas, 0, 0);
    
    
}