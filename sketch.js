/* =======================

3D Mirror - by Harold Sikkema harold.sikkema@sheridancollege.ca
-Made with p5js, WebGL, and ml5
-Inspiration via a 2020 project by Rowan Abraham & Arash Nouri (thank you!)
-Displays a textured 3D mesh with p5js and WebGL
-Tracks XYZ rotation of user's face via webcam and ML5 facemesh 
-Maps user's head movements onto 3D mesh

I have found the "mirror" logic of this sketch to be provocative and surprising. 
It has led me to be more curious about my relationship with the world around me.
I invite you to adapt the code for your own explorations.

========================*/

let webcam       // the webcam will be loaded into this variable. 
let facemesh  // we will load the facemesh library into this variable.

let faces = []        // This is where FaceMesh will store the faces that it finds
let keypoints = []    // FaceMesh will store hundreds of facial landmarks here. 

// Of the hundreds of keypoints provided by FaceMesh we really only need five:
// With a baseline of forehead, chin, eyes, nose we can calculate all the angles we need. 
let forehead 
let chin
let leftEye 
let rightEye
let nose

let displayObject   // a variable to hold our 3D model
let objectTexture   // a variable to hold an image texture for our 3D model
let drama = 1.8     // this is a multiplier that adds dramatic effect throughout the sketch

let ready = false   // use this variable to track if facemesh is ready (it takes a while to load)

// This model was 3D scanned from an actual shell with Agisoft Metashape 
// See also: https://p5js.org/reference/#/p5/loadModel
preload = () => {
  displayObject = loadModel('shell.obj', true)
  objectTexture = loadImage('shell.jpg')
}

setup = () => { 
  // If we are inside an iFrame, that's not ideal.
  // in this case we show a notice to recommend opening a separate tab
  if (window.frameElement){
    document.querySelector('#TabNotice').style.display = "block"
  }
  // The code below only runs if we have a dedicated window.
  else{
    // display a loading image on the page during setup
    document.querySelector('body').style.backgroundImage ="url(load.gif)"

    // a WEBGL canvas is needed to make 3D models.
    theCanvas = createCanvas(windowWidth, windowHeight, WEBGL)
    // Get a video feed from the webcam.
    webcam = createCapture(VIDEO)
    webcam.hide() 
    facemesh = ml5.facemesh(webcam, modelReady)
    facemesh.on("predict", data => { faces = data }) 
    normalMaterial() // a material not affected by light
    noStroke()
  }

}

// The draw loop is really a list of other functions that you can find below
draw = () => {
  clear()  
  if (faces.length){
    if (!ready) { initialize() }
    updateKeypoints()
    //drawFaceMesh()
    headPosition()  
    headScale()
    headShake()
    headNod()
    headTilt()  
    calibrate()
    texture(objectTexture)
    model(displayObject)
  }
}

// turn off the loading animation by updating the background style
initialize = () => {
  document.querySelector('body').style.background = '#afdda3'
  ready = true;
}

// Here we get the latest data from FaceMesh and average it with the previous frame
// We use Linear Interpolation to do this. 
// See also: https://p5js.org/reference/#/p5/lerp
// Lerp causes outlier data to be smoothed out, and the animation as well
updateKeypoints = () => {
  if (keypoints.length){
    for (let i=0; i < faces[0].scaledMesh.length; i++ ){
      // 0, 1, and 2 correspond to X Y Z 
      keypoints[i][0] = lerp(keypoints[i][0], faces[0].scaledMesh[i][0], 0.5)
      keypoints[i][1] = lerp(keypoints[i][1], faces[0].scaledMesh[i][1], 0.5)
      keypoints[i][2] = lerp(keypoints[i][2], faces[0].scaledMesh[i][2], 0.5)
    }
  }
  else{
    // the first time 
     keypoints = faces[0].scaledMesh
  }

  // These points of interest correspond to numbers on the full FaceMesh map:
  // https://raw.githubusercontent.com/tensorflow/tfjs-models/master/facemesh/mesh_map.jpg
  nose = keypoints[1]
  forehead = keypoints[10]
  chin = keypoints[152]
  leftEye = keypoints[226]
  rightEye = keypoints[446]
  
}

// Display all the points in the mesh for reference. 
// Points are offset and scaled down to allow more space for the 3D model. 
drawFaceMesh = () => {
  for (i in keypoints) {
    let [x, y] = keypoints[i]   
    push()    
      translate(150,-350) 
      scale(-0.5, 0.5)
      fill(86, 117, 78)  // dark green
      ellipse(x, y, 5, 5)
    pop() 
  }
}

windowResized = () => {
  resizeCanvas(windowWidth, windowHeight)
}
 
modelReady = () => {
  console.log("Facemesh Model ready!")
}

headPosition = () => {
  const translateX = map(nose[0], 0, webcam.width, -width/2, width/2)
  const translateY = map(nose[1], 0, webcam.height, -height/2, height/2)
  translate(-translateX , translateY)
}

headScale = () => {
  const yDistance = dist(forehead[0],forehead[1],forehead[2],chin[0],chin[1],chin[2])
  const xDistance = dist(leftEye[0],leftEye[1],leftEye[2],rightEye[0],rightEye[1],rightEye[2])
  const yScale = map(yDistance,0,600,0,3)
  const xScale = map(xDistance,0,400,0,3)
  scale( (yScale + xScale) / 2  * drama)
}

// In this sketch, head rotation is tracked along 3 axes. 
// In the language of aerospace you might call this "Yaw", "Pitch", and "Roll"
// For ease of understanding I have called them "headNod", "headShake", and "headTilt"

// The below approach to head rotation along the XYZ axes is adapted from @akhirai560
// See also: https://github.com/tensorflow/tfjs/issues/3835#issuecomment-792465923

// This axis correlates with shaking your head "no"
headShake = () => {
  const xMidPoint = [ 
      (leftEye[0] + rightEye[0]) * 0.5, 
      0, 
      (leftEye[2] + rightEye[2]) * 0.5 
  ]
  const xAdjacent = leftEye[2] - xMidPoint[2]
  const xOpposite = leftEye[0] - xMidPoint[0]
  const xHypotenuse =  Math.sqrt( Math.pow(xAdjacent,2) + Math.pow(xOpposite,2) )
  rotateY( xAdjacent / xHypotenuse * drama) 
}

// This axis correlates with nodding your head "yes" 
headNod = () => { 
  const yMidPoint = [ 0, (forehead[1] + chin[1]) * 0.5, (forehead[2] + chin[2]) * 0.5 ]
  const yAdjacent = forehead[2] - yMidPoint[2]
  const yOpposite = forehead[1] - yMidPoint[1]
  const yHypotenuse =  Math.sqrt( Math.pow(yAdjacent,2) + Math.pow(yOpposite,2) )
  rotateX( yAdjacent / yHypotenuse * drama) 
}

// Head tilt is the least predictable metric here due to a 45 degree limit in the FaceMesh model
// See also: https://mediapipe.page.link/facemesh-mc
headTilt = () => {
  const zMidPoint = [ (forehead[0] + chin[0]) * 0.5, (forehead[1] + chin[1]) * 0.5, 0 ]
  const zAdjacent = forehead[0] - zMidPoint[0]
  const zOpposite = forehead[1] - zMidPoint[1]
  const zHypotenuse =  Math.sqrt( Math.pow(zAdjacent,2) + Math.pow(zOpposite,2) )
  rotateZ( - zAdjacent / zHypotenuse * drama) 
}

// If your model is facing the wrong way You might like to adjust the orientation manually
// Thus, a calibrate function as a convenient place to do this. 
// rotation is given in Radians; if you want to work in degrees, you'll need to convert first.
calibrate = () => {
  rotateX(PI)
}