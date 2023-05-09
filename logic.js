var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var init_size = true;
var idles = ['idle', 'idleBackAndForth', 'idleBreathing', 'idleFall', 'idleLayDown', 'idleLookAround', 'idleLookDown', 'idleLookLeft', 'idleLookRight', 'idleLookUp', 'idleSit', 'idleSpin', 'idleWave'];
const sprites = [];
const JSON_WAITING_TIME = 100, SPRITE_WAITING_TIME = 1000;
var animData;               // JSON animation data stored here
var animations = [];        // Array of animation arrays 2D 
var dataLoaded = false; 
const states = new Map([    // Mapping for animations array
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
        checkJsonLoaded();
    });

// Wait for data to load then wait five seconds before penguins begin walking
function checkJsonLoaded() {
    if (!dataLoaded) {
        setTimeout(checkJsonLoaded, JSON_WAITING_TIME);
        return;
    }
}

// Returns a random Idle animation
function getIdleAnimation() {
    //let numb = Math.floor(Math.random() * idles.length); // Broken random idle animations
    let idleAnim = idles[1];
    return idleAnim;
}

// Vector interaction functions //
// Returns distance between two vectors
function dist(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

// Returns the current mag (length) of a vector
function getMag(vec) { 
    return Math.sqrt(Math.pow(vec[0],2) + Math.pow(vec[1],2));
}

// Divide each element by it's mag (length) to normalize to an unit vector
function normalize(vec) { 
    let m = getMag(vec);
    let nvec = vec.slice();
    nvec[0] /= m;
    nvec[1] /= m;
    return nvec;
}

// Divide each element by it's original mag to normalize then scale with new mag
function setMag(vec, mag) { 
    let unitVector = normalize(vec);
    unitVector[0] *= mag;
    unitVector[1] *= mag;
    vec[0] = unitVector[0];
    vec[1] = unitVector[1];
}

// Divide each element by it's original mag to normalize then scale the limit if the mag is over the limit
function setLimit(vec, limit) { 
    let m = getMag(vec);
    if (m > limit) {
        let unitVector = normalize(vec);
        unitVector[0] *= limit;
        unitVector[1] *= limit;
        vec[0] = unitVector[0];
        vec[1] = unitVector[1];
    }
}

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

// A penguin sprite has: Width, height, (x,y) position, idle relative path, time_delta
class Sprite {
    constructor(x, y, timeDelta, h, w, startSpeed, perception) {
        this.x_y = [Math.random() * canvas.width, Math.random() * canvas.height];
        //this.x_y = [x,y];
        this.h_w = [h,w];
        this.perception = perception;
        this.startSpeed = startSpeed;

        this.acceleration = [0,0];
        this.velocity = this.randomDirection();
        setMag(this.velocity, Math.random() < 0.5 ? 2 : 4 )
        this.maxVelocity = 5;
        this.maxForce = 2;

        this.timeDelta = timeDelta;
        this.lastAnimTime = new Date().getTime();
        this.state = getIdleAnimation();
        this.animState = 0;
        this.bgIMG = null;
    }

    randomDirection () {
        let theta = Math.random() * 2 * Math.PI; // startingSpeed=1, theta=(0-1) * 2pi
        return [Math.cos(theta) * this.startSpeed, Math.sin(theta) * this.startSpeed]; // calculate x,y given angle & startingSpeed
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
            //console.log(error + " state: " + this.state);
            //console.log(animations);
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

    edges() {
        if (this.x_y[0] > canvas.width) // X bound check
            this.x_y[0] = 0;
        else if (this.x_y[0] < 0)
            this.x_y[0] = canvas.width;

        if (this.x_y[1] > canvas.height) // Y bound check
            this.x_y[1] = 0;
        else if (this.x_y[1] < 0)
            this.x_y[1] = canvas.height;
    }
    move() {
        // Update state based off position  
        let x = this.x_y[0] + this.velocity[0] || this.x_y[0];      
        let y = this.x_y[1] + this.velocity[1] || this.x_y[1];  
        this.state = this.getMovementDirection([x,y]);
        // Set pos
        this.x_y[0] = x;
        this.x_y[1] = y;
        // Set velocity
        this.velocity[0] += this.acceleration[0];
        this.velocity[1] += this.acceleration[1];
        setLimit(this.velocity, this.maxVelocity);  
    }

    // Align with the other boids velocity if they're within perception
    align(boids) {
        let steering = [0,0];
        let nearbyBoids = 0;
        let perception = document.getElementById("perception").value;
        for (let i = 0; i < boids.length; i++) {
            if (boids[i] != this && dist(this.x_y, boids[i].x_y) < perception) {
                nearbyBoids++;
                steering[0] += boids[i].velocity[0]
                steering[1] += boids[i].velocity[1]
            }
        }
        if (nearbyBoids > 0) {
            steering[0] /= nearbyBoids;
            steering[1] /= nearbyBoids;
            setMag(steering, this.maxVelocity);
            steering[0] -= this.velocity[0];
            steering[1] -= this.velocity[1];
            setLimit(steering, this.maxForce);
            return steering;
        }
        return [0,0];
    }

    // Move towards the other boids position if they're within perception
    coheision(boids) {
        let steering = [0,0];
        let nearbyBoids = 0;
        let perception = document.getElementById("perception").value;
        for (let i = 0; i < boids.length; i++) {
            if (boids[i] != this && dist(this.x_y, boids[i].x_y) < perception) {
                nearbyBoids++;
                steering[0] += boids[i].x_y[0]
                steering[1] += boids[i].x_y[1]
            }
        }
        if (nearbyBoids > 0) {
            steering[0] /= nearbyBoids;
            steering[1] /= nearbyBoids;
            setMag(steering, this.maxVelocity);
            steering[0] -= this.velocity[0];
            steering[1] -= this.velocity[1];
            setLimit(steering, this.maxForce);
            return steering;
        }
        return [0,0];
    }

    // Move away from other boids by calculating the average inverse distance difference of each boid to the main boid
    seperation(boids) {
        let steering = [0,0];
        let nearbyBoids = 0;
        let perception = document.getElementById("perception").value;
        for (let i = 0; i < boids.length; i++) {
            let dis = dist(this.x_y, boids[i].x_y);
            if (boids[i] != this && dis < perception) {
                let diff = [this.x_y[0] - boids[i].x_y[0], this.x_y[1] - boids[i].x_y[1]];
                diff[0] /= dis;
                diff[1] /= dis;
                steering[0] += diff[0];
                steering[1] += diff[1];
                nearbyBoids++;
            }
        }
        if (nearbyBoids > 0) {
            steering[0] /= nearbyBoids;
            steering[1] /= nearbyBoids;
            setMag(steering, this.maxVelocity);
            steering[0] -= this.velocity[0];
            steering[1] -= this.velocity[1];
            setLimit(steering, this.maxForce);
            return steering;
        }
        return [0,0];
    }

    flock(boids) {
        this.acceleration[0] = 0;
        this.acceleration[1] = 0;
        let alignment = this.align(boids);
        let coheision = this.coheision(boids);
        let seperation = this.seperation(boids);

        // Scale by sliders
        let alignScale = document.getElementById("alignment").value;
        let cohesionScale = document.getElementById("cohesion").value;
        let sepertScale = document.getElementById("seperation").value;
        alignment[0] *= alignScale;
        alignment[1] *= alignScale;
        coheision[0] *= cohesionScale;
        coheision[1] *= cohesionScale;
        seperation[0] *= sepertScale;
        seperation[1] *= sepertScale;

        // Add forces
        this.acceleration[0] += alignment[0];       // Add alignment force
        this.acceleration[1] += alignment[1]; 
        this.acceleration[0] += coheision[0];       // Add cohesion force
        this.acceleration[1] += coheision[1];
        this.acceleration[0] += seperation[0];       // Add seperation force
        this.acceleration[1] += seperation[1];
    }
    
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
checkJsonLoaded();
let howManyPenguins = 100;
for (let j = 0; j < howManyPenguins; j++) {
    let penguin = new Sprite(canvas.width/2, canvas.height/2, 2, 30, 30, 1, 40);
    sprites.push(penguin);
}
resizeCanvas();
call_me_on_draw();

// notes for keeping Sprites track of shared resources, spirite[] array, score, boundaries. Threads need to check & update the shared resource!
// World view - the world can be affected by Sprites on it, projecting shadow/shading. Paraellel, not sequestrial.

function call_me_on_draw(){
    context.clearRect(0, 0, canvas.width, canvas.height);   
    
    for (let i = 0; i < sprites.length; i++) {
        sprites[i].edges();
        sprites[i].draw();
        sprites[i].flock(sprites);
        sprites[i].move();
    }
    window.requestAnimationFrame(call_me_on_draw.bind(this));
}