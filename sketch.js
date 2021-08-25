/* =======================

3D Mirror - by Harold Sikkema
-Made with p5js, WebGL, and ml5
-Inspiration via a 2020 project by Rowan Abraham & Arash Nouri (thank you!)
-Displays a textured 3D mesh with p5js and WebGL
-Tracks XYZ rotation of user's face via webcam and ML5 facemesh 
-Maps user's head movements onto 3D mesh

While hiking in Ontario I encounter landmarks of stacked stones marking the way.
They remind me that I share the trail (and the land itself) with others:
those who came before and those who will follow after.
In particular they invite an awareness of inuksuk and innunguaq as enduring Inuit symbols.

“We are happy that others appreciate our symbols but we do not want the meaning taken out of our symbols. 
Inuit have used the inuksuk for survival and assign a lot of value to its preservation”
-Piita Taqtu Irniq

I have found the "mirror" logic of this sketch to be provocative and surprising. 
It has led me to be more curious about my relationship with the world around me.
I invite you to adapt the code for your own explorations.

========================*/

let cam;
let facemesh;

let predictions = []
let keypoints = []
// See also:
// https://raw.githubusercontent.com/tensorflow/tfjs-models/master/facemesh/mesh_map.jpg

let forehead 
let chin
let leftEye 
let rightEye

let displayObject
let objectTexture
let drama = 1.5

let ready = false

preload = () => {
  displayObject = loadModel('assets/rocks.obj', true)
  objectTexture = loadImage('assets/rocks.jpg')
}

setup = () => { 
  theCanvas = createCanvas(windowWidth, windowHeight, WEBGL)
  theCanvas.hide()
  cam = createCapture(VIDEO)
  cam.hide() 
  facemesh = ml5.facemesh(cam, modelReady)
  facemesh.on("predict", data => { predictions = data }) 
  normalMaterial() // a material not affected by light
  strokeWeight(2) 
  fill(255, 0, 0, 0)
}

draw = () => {
  clear()  
  if (predictions.length){
    if (!ready) { initialize() }
    updateKeypoints()
    //drawMesh()
    headScale()
    headShake()
    headNod()
    headTilt()  
    rotateX(PI); // flip default p5js orientation
    texture(objectTexture);
    model(displayObject);
  }
}


initialize = () => {
  theCanvas.show()
  const bgStyle = 'background-image: none; background-color: #afdda3';
  document.getElementsByTagName("body")[0].style = bgStyle
  ready = true;
}

updateKeypoints = () => {
  if (keypoints.length){
    for (let i=0; i < predictions[0].scaledMesh.length; i++ ){
      keypoints[i][0] = lerp(keypoints[i][0], predictions[0].scaledMesh[i][0], 0.5)
      keypoints[i][1] = lerp(keypoints[i][1], predictions[0].scaledMesh[i][1], 0.5)
      keypoints[i][2] = lerp(keypoints[i][2], predictions[0].scaledMesh[i][2], 0.5)
    }
  }
  else{
    keypoints = predictions[0].scaledMesh
  }
  forehead = keypoints[10]
  chin = keypoints[152]
  leftEye = keypoints[226]
  rightEye = keypoints[446]
}

drawMesh = () => {
  for (let j = 0; j < keypoints.length; j += 1) {
    const [x, y] = keypoints[j]       
    translate(75,-350) 
    scale(-0.25, 0.25);
    ellipse(x, y, 5, 5)
    scale(-4, 4);
    translate(-75,350) 
  }
}

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight)
}
 
modelReady = () => {
  console.log("Facemesh Model ready!")
}

headNod = () => { 
  const yMidPoint = [ 0, (forehead[1] + chin[1]) * 0.5, (forehead[2] + chin[2]) * 0.5 ]
  const yAdjacent = forehead[2] - yMidPoint[2]
  const yOpposite = forehead[1] - yMidPoint[1]
  const yHypotenuse =  Math.sqrt( Math.pow(yAdjacent,2) + Math.pow(yOpposite,2) )
  rotateX( yAdjacent / yHypotenuse * drama) // yCos
}

headShake = () => {
  const xMidPoint = [ (leftEye[0] + rightEye[0]) * 0.5, 0, (leftEye[2] + rightEye[2]) * 0.5 ]
  const xAdjacent = leftEye[2] - xMidPoint[2]
  const xOpposite = leftEye[0] - xMidPoint[0]
  const xHypotenuse =  Math.sqrt( Math.pow(xAdjacent,2) + Math.pow(xOpposite,2) )
  rotateY( xAdjacent / xHypotenuse * drama) // xCos
}

headTilt = () => {
  const zMidPoint = [ (forehead[0] + chin[0]) * 0.5, (forehead[1] + chin[1]) * 0.5, 0 ]
  const zAdjacent = forehead[0] - zMidPoint[0]
  const zOpposite = forehead[1] - zMidPoint[1]
  const zHypotenuse =  Math.sqrt( Math.pow(zAdjacent,2) + Math.pow(zOpposite,2) )
  rotateZ( - zAdjacent / zHypotenuse * drama) // zCos
}

headScale = () => {
  const yDistance = dist(forehead[0],forehead[1],forehead[2],chin[0],chin[1],chin[2])
  const xDistance = dist(leftEye[0],leftEye[1],leftEye[2],rightEye[0],rightEye[1],rightEye[2])
  const yScale = map(yDistance,0,600,0,3)
  const xScale = map(xDistance,0,400,0,3)
  scale( (yScale + xScale) / 2  * drama)
}
