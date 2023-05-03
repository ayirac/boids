var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var bufferedCanvas = document.createElement('canvas');
bufferedCanvas.width = window.innerWidth;
bufferedCanvas.height = window.innerHeight;
var bufferedContext = bufferedCanvas.getContext('2d');

var mouseDown;
var mouseX;
var mouseY;
var init_size = true;
var keys = {};
var idles = ['idle', 'idleBackAndForth', 'idleBreathing', 'idleFall', 'idleLayDown', 'idleLookAround', 'idleLookDown', 'idleLookLeft', 'idleLookRight', 'idleLookUp', 'idleSit', 'idleSpin', 'idleWave'];
var alreadyIdle = false;
var distThresh = 55; 
const sprites = [];

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
    constructor(x, y, timeDelta, h, w) {
        this.x_y = [x,y];
        this.h_w = [h,w];
        this.velocity = [Math.floor(Math.random() * 20) - 10, Math.floor(Math.random() * 20) - 10];
        console.log("x: " + this.x_y[0])
        this.acceleration = [1,1];

        this.timeDelta = timeDelta;
        this.lastAnimTime = new Date().getTime();
        this.state = 'idle';
        this.animState = 0;
        this.bgIMG = null;
        this.animData;
        this.animations = [];
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
                    
                    this.animations.push(animArr);
                }    
                this.animData = animData;
            });
    }

    draw(){
        if ((this.timeDelta + this.lastAnimTime) > new Date().getTime())
            return;
        this.lastAnimTime =  new Date().getTime();
        
        this.bgIMG = bufferedContext.getImageData(this.x_y[0], this.x_y[1], this.h_w[1], this.h_w[0]);
        if (this.bgIMG != null)
            bufferedContext.putImageData(this.bgIMG, this.x_y[0], this.x_y[1]);
        
        //context.clearRect(this.x_y[0], this.x_y[1], this.h_w[1]*1.2, this.h_w[0]*1.2);
        //bufferedContext.clearRect(this.x_y[0], this.x_y[1], this.h_w[1]*1.2, this.h_w[0]*1.2);

        
        // bug here, undef
        try {
            if (this.animations[states.get(this.state)][this.animState] === undefined) {
                this.animState = 0;
            }
            let img = this.animations[states.get(this.state)][this.animState];
                
            this.animState = (this.animState + 1) % this.animations[states.get(this.state)].length;
            
            bufferedContext.drawImage(img, this.x_y[0], this.x_y[1], this.h_w[1], this.h_w[0]);
        } catch (error) {
            console.log(error);
            console.log(this.state);
        }
        this.move(); // MIGHT be better to put at end
    }

    move() {
        const canvasBox = canvas.getBoundingClientRect();
        this.state = 'walk_N'; // change based on velocity/position, yada
        

        let x = this.x_y[0] + this.velocity[0];
        let y = this.x_y[1] + this.velocity[1];
        if (x > (canvasBox.left + canvasBox.width - this.h_w[1]) || y < canvasBox.top || x < canvasBox.left || y > (canvasBox.top + canvasBox.height - this.h_w[0]*1.5)) // check if exited bounds, check if penguin 
            return;
        
        this.x_y[0] = x;
        this.x_y[1] = y;
        alreadyIdle = false;
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
let howManyPenguins = 2;
for (let j = 0; j < howManyPenguins; j++) {
    let penguin = new Sprite(canvas.width/2, canvas.height/2, 50, 50, 50);
    sprites.push(penguin);
}
resizeCanvas();
call_me_on_draw();

// World view - the world can be affected by Sprites on it, projecting shadow/shading. Paraellel, not sequestrial.

function call_me_on_draw(){
   

    //context.clearRect(this.x_y[0], this.x_y[1], this.h_w[1]*1.2, this.h_w[0]*1.2);
    bufferedContext.clearRect(0, 0, canvas.width, canvas.height)
    context.clearRect(0, 0, canvas.width, canvas.height);   

    for (let i = 0; i < sprites.length; i++) {
        sprites[i].draw();
    }
    context.drawImage(bufferedCanvas, 0, 0);

    window.requestAnimationFrame(call_me_on_draw.bind(this));
}