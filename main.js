// Get a reference to the gameCanvas element
const canvas = document.getElementById('gameCanvas');

// Create a THREE.Scene
const scene = new THREE.Scene();

// Create a THREE.PerspectiveCamera
const camera = new THREE.PerspectiveCamera(
    75, // FOV (Field of View)
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.set(0, 10, 20); // Position the camera to look at the origin
camera.lookAt(0, 0, 0);

// Create a THREE.WebGLRenderer and attach it to the gameCanvas
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows

// Define constants
const TABLE_LENGTH = 10;
const TABLE_WIDTH = 5;
const TABLE_HEIGHT = 0.2;
const CUSHION_THICKNESS = 0.2;
const CUSHION_HEIGHT = 0.3;
const BALL_RADIUS = 0.15;

// Create Table Surface
const tableSurfaceGeometry = new THREE.BoxGeometry(TABLE_WIDTH, TABLE_HEIGHT, TABLE_LENGTH);
const tableSurfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 }); // Green
const tableSurface = new THREE.Mesh(tableSurfaceGeometry, tableSurfaceMaterial);
tableSurface.position.y = -TABLE_HEIGHT / 2; // Position it so its top is at y=0
tableSurface.receiveShadow = true;
scene.add(tableSurface);

// Create Cushions
const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown

// Simplified cushions for now (four main sides)
// Long cushions (along Z axis)
const longCushionGeometry = new THREE.BoxGeometry(TABLE_WIDTH + 2 * CUSHION_THICKNESS, CUSHION_HEIGHT, CUSHION_THICKNESS);
const topCushion = new THREE.Mesh(longCushionGeometry, cushionMaterial);
topCushion.position.set(0, CUSHION_HEIGHT / 2, -(TABLE_LENGTH / 2) - CUSHION_THICKNESS / 2);
topCushion.castShadow = true;
scene.add(topCushion);

const bottomCushion = new THREE.Mesh(longCushionGeometry, cushionMaterial);
bottomCushion.position.set(0, CUSHION_HEIGHT / 2, (TABLE_LENGTH / 2) + CUSHION_THICKNESS / 2);
bottomCushion.castShadow = true;
scene.add(bottomCushion);

// Short cushions (along X axis)
const shortCushionGeometry = new THREE.BoxGeometry(CUSHION_THICKNESS, CUSHION_HEIGHT, TABLE_LENGTH);
const leftCushion = new THREE.Mesh(shortCushionGeometry, cushionMaterial);
leftCushion.position.set(-(TABLE_WIDTH / 2) - CUSHION_THICKNESS / 2, CUSHION_HEIGHT / 2, 0);
leftCushion.castShadow = true;
scene.add(leftCushion);

const rightCushion = new THREE.Mesh(shortCushionGeometry, cushionMaterial);
rightCushion.position.set((TABLE_WIDTH / 2) + CUSHION_THICKNESS / 2, CUSHION_HEIGHT / 2, 0);
rightCushion.castShadow = true;
scene.add(rightCushion);


// Create Balls
const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);

const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });

const ballPositions = [
    { x: 0, y: BALL_RADIUS, z: -TABLE_LENGTH / 4 }, // White (Cue ball)
    { x: 0, y: BALL_RADIUS, z: TABLE_LENGTH / 4 },    // Yellow
    { x: BALL_RADIUS * 2, y: BALL_RADIUS, z: TABLE_LENGTH / 4 + BALL_RADIUS * 3 }, // Red 1
    { x: -BALL_RADIUS * 2, y: BALL_RADIUS, z: TABLE_LENGTH / 4 + BALL_RADIUS * 3 }  // Red 2
];

const ballMaterials = [whiteMaterial, yellowMaterial, redMaterial, redMaterial];
const balls = []; // Array to store ball objects for physics

// Game state variables
let score = 0;
let currentPlayerCueBall; // Will be assigned after balls are created
let ballsHitThisShot = new Set();
let shotInProgress = false;

// Controls and UI
const scoreDisplayElement = document.getElementById('scoreDisplay');
let cueStick;
const aimingDirection = new THREE.Vector3();
let isDraggingForPower = false;
let startMouseCoords = new THREE.Vector2(); // For power drag
const raycaster = new THREE.Raycaster();
const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BALL_RADIUS); // Aiming plane at ball equator
const mouse = new THREE.Vector2(); // For normalized mouse coords

const MAX_SHOT_POWER = 20; // Max speed for the cue ball
const POWER_SCALE_FACTOR = 0.03; // Scales mouse drag to power
const CUE_OFFSET_DISTANCE = 0.5; // How far back cue is initially from ball
const CUE_BALL_STOPPED_THRESHOLD = MIN_SPEED_THRESHOLD * MIN_SPEED_THRESHOLD;


// Physics constants
const FRICTION_FACTOR = 0.5; // Affects how quickly balls slow down (percentage per second)
const RESTITUTION = 0.8;   // Bounciness of collisions
const MIN_SPEED_THRESHOLD = 0.05; // Speed below which balls are considered stopped

for (let i = 0; i < ballPositions.length; i++) {
    const ball = new THREE.Mesh(ballGeometry, ballMaterials[i]);
    ball.position.set(ballPositions[i].x, ballPositions[i].y, ballPositions[i].z);
    ball.castShadow = true;
    ball.receiveShadow = true;

    // Initialize physics properties
    ball.userData.velocity = new THREE.Vector3();
    ball.userData.mass = 1; // All balls have mass 1 for simplicity

    // Assign color for scoring logic
    // Ball order: 0:white, 1:yellow, 2:red1, 3:red2
    if (i === 0) { // White
        ball.userData.colorName = 'white';
    } else if (i === 1) { // Yellow
        ball.userData.colorName = 'yellow';
    } else if (i === 2) { // Red 1
        ball.userData.colorName = 'red1';
    } else if (i === 3) { // Red 2
        ball.userData.colorName = 'red2';
    }


    scene.add(ball);
    balls.push(ball); // Add to our list for physics updates
}

// Assign cue ball
if (balls.length > 0) {
    currentPlayerCueBall = balls[0]; // White ball
    console.log("Player Cue Ball is set to:", currentPlayerCueBall.userData.colorName);
}

// Create Cue Stick
const cueGeometry = new THREE.CylinderGeometry(0.03, 0.04, 2.5, 12); // radiusTop, radiusBottom, height, radialSegments
cueGeometry.translate(0, 2.5 / 2, 0); // Move origin to the base of the cue
cueGeometry.rotateX(Math.PI / 2); // Align along Z-axis initially
const cueMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brownish
cueStick = new THREE.Mesh(cueGeometry, cueMaterial);
cueStick.visible = false; // Initially hidden
scene.add(cueStick);


// Give the white ball (cue ball, first in array) an initial velocity for testing - REMOVE FOR USER CONTROL
// if (balls.length > 0 && currentPlayerCueBall) {
//     console.log("Initiating first (automated) shot.");
//     shotInProgress = true;
//     ballsHitThisShot.clear();
//     currentPlayerCueBall.userData.velocity.set(0, 0, 7); // Moving along positive Z towards other balls
// }


// Add Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 15, 10); // Position the light
directionalLight.castShadow = true;
// Configure shadow properties for better quality (optional)
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -TABLE_WIDTH * 1.5;
directionalLight.shadow.camera.right = TABLE_WIDTH * 1.5;
directionalLight.shadow.camera.top = TABLE_LENGTH * 1.5;
directionalLight.shadow.camera.bottom = -TABLE_LENGTH * 1.5;

scene.add(directionalLight);

// Adjust camera position to better view the table
camera.position.set(0, 8, TABLE_LENGTH / 2 + 5); // Slightly further and higher
camera.lookAt(0, 0, 0);

const clock = new THREE.Clock(); // For calculating deltaTime

// Import game logic functions
// For browser environment, if gameLogic.js is included via <script> before main.js,
// its functions will be globally available.
// If gameLogic.js were an ES module, we'd use:
// import { resolveBallCollision, computeScoreForShot } from './gameLogic.js';
// Assuming global functions for now as per Option 1 for tests.html simplicity.

// --- Game Logic Functions (Wrappers/Connectors to core logic) ---
function areAllBallsStopped() {
    for (const ball of balls) {
        if (ball.userData.velocity.lengthSq() >= MIN_SPEED_THRESHOLD * MIN_SPEED_THRESHOLD) {
            return false; // Found a ball that is still moving
        }
    }
    return true; // All balls are stopped
}

// This function now uses computeScoreForShot from gameLogic.js
function handleScoring() {
    if (ballsHitThisShot.size === 0) {
        console.log("Shot ended. Cue ball didn't hit any other balls.");
        // updateScoreDisplay(); // score didn't change, but good practice if other UI elements did
        return;
    }

    const objectBallColors = ['yellow', 'red1', 'red2'];
    const pointsThisShot = computeScoreForShot(ballsHitThisShot, currentPlayerCueBall, objectBallColors);

    if (pointsThisShot > 0) {
        score += pointsThisShot;
        console.log(`Point Scored! (+${pointsThisShot}). Current Score: ${score}`);
    } else {
        console.log(`No Point. Current Score: ${score}`);
    }
    // Log details (could be part of computeScoreForShot or here)
    let hitBallDescriptions = [];
    ballsHitThisShot.forEach(hitBall => {
         if (hitBall !== currentPlayerCueBall) hitBallDescriptions.push(hitBall.userData.colorName);
    });
    console.log(`Details: Cue ball hit: ${hitBallDescriptions.join(', ') || 'nothing relevant'}.`);
    
    updateScoreDisplay(); // Update UI with new score
}


function updateScoreDisplay() {
    if (scoreDisplayElement) {
        scoreDisplayElement.textContent = `Score: ${score}`;
    }
}

// --- End Game Logic Functions ---

// Initialize Score Display
updateScoreDisplay();

// Add a basic animation loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    // Check if shot has ended
    if (shotInProgress && areAllBallsStopped()) {
        console.log("All balls have stopped. Calculating score...");
        handleScoring(); // Use the new handler
        shotInProgress = false;
        ballsHitThisShot.clear();
        console.log("Ready for the next shot. Cue should become visible if ball stopped.");
        if (currentPlayerCueBall && currentPlayerCueBall.userData.velocity.lengthSq() < CUE_BALL_STOPPED_THRESHOLD) {
            // This is a good place to ensure the cue becomes visible if mouse isn't moving
            // but usually mousemove will handle it.
            // cueStick.visible = true; // Potentially, if not handled by mousemove
        }
    }

    // Physics updates
    balls.forEach((ball, index) => {
        // Only update physics for balls that are moving or could be moved by a collision
        // This condition `if (ball.userData.velocity.lengthSq() === 0) return;` was too simple.
        // A stationary ball can be hit. Physics should always run for all balls.
        // Stopping happens when speed drops below threshold.

        // Update position
        ball.position.addScaledVector(ball.userData.velocity, deltaTime);

        // Apply friction
        // v_new = v_old * (1 - friction_coeff * dt)
        // This ensures friction is applied more consistently across different frame rates.
        const speed = ball.userData.velocity.length();
        if (speed > 0) {
            const frictionForceMagnitude = FRICTION_FACTOR * ball.userData.mass; // Simplified friction force
            const dragAcceleration = frictionForceMagnitude / ball.userData.mass; // a = F/m
            
            // Calculate velocity reduction based on drag and deltaTime
            // We want to reduce speed by 'dragAcceleration * deltaTime'
            // If current speed is less than that, set speed to 0
            if (speed <= dragAcceleration * deltaTime) {
                 ball.userData.velocity.set(0,0,0);
            } else {
                 ball.userData.velocity.multiplyScalar(1 - (dragAcceleration * deltaTime / speed));
            }
        }


        // Stop balls with very low speed
        if (ball.userData.velocity.lengthSq() < MIN_SPEED_THRESHOLD * MIN_SPEED_THRESHOLD) {
            ball.userData.velocity.set(0, 0, 0);
        }

        // Ball-Cushion Collisions
        const cushionBoundaryX = TABLE_WIDTH / 2 - BALL_RADIUS;
        const cushionBoundaryZ = TABLE_LENGTH / 2 - BALL_RADIUS;

        // Check X-axis cushions (left/right)
        if (ball.position.x > cushionBoundaryX) {
            ball.position.x = cushionBoundaryX;
            ball.userData.velocity.x *= -RESTITUTION;
        } else if (ball.position.x < -cushionBoundaryX) {
            ball.position.x = -cushionBoundaryX;
            ball.userData.velocity.x *= -RESTITUTION;
        }

        // Check Z-axis cushions (top/bottom)
        if (ball.position.z > cushionBoundaryZ) {
            ball.position.z = cushionBoundaryZ;
            ball.userData.velocity.z *= -RESTITUTION;
        } else if (ball.position.z < -cushionBoundaryZ) {
            ball.position.z = -cushionBoundaryZ;
            ball.userData.velocity.z *= -RESTITUTION;
        }
    });

    // Ball-Ball Collisions
    for (let i = 0; i < balls.length; i++) {
        const ball1 = balls[i];
        if (ball1.userData.velocity.lengthSq() === 0 && balls.every(b => b.position.distanceTo(ball1.position) > 2 * BALL_RADIUS || b === ball1)) {
            // Optimization: if ball1 is stationary and not overlapping, it can't initiate a new collision
            // This needs to be careful if external forces can move stationary balls
           // continue; 
        }

        for (let j = i + 1; j < balls.length; j++) {
            const ball2 = balls[j];

            const distance = ball1.position.distanceTo(ball2.position);

            if (distance < 2 * BALL_RADIUS) {
                // Collision detected

                // Scoring: Record hits by the cue ball during a shot
                if (shotInProgress) {
                    if (ball1 === currentPlayerCueBall && ball2 !== currentPlayerCueBall) {
                        if (!ballsHitThisShot.has(ball2)) {
                            ballsHitThisShot.add(ball2);
                            console.log(`Cue ball (${currentPlayerCueBall.userData.colorName}) hit ${ball2.userData.colorName}.`);
                        }
                    } else if (ball2 === currentPlayerCueBall && ball1 !== currentPlayerCueBall) {
                        if (!ballsHitThisShot.has(ball1)) {
                            ballsHitThisShot.add(ball1);
                            console.log(`Cue ball (${currentPlayerCueBall.userData.colorName}) hit ${ball1.userData.colorName}.`);
                        }
                    }
                }
                
                const normal = new THREE.Vector3().subVectors(ball2.position, ball1.position).normalize();
                
                // Relative velocity
                const vRel = new THREE.Vector3().subVectors(ball1.userData.velocity, ball2.userData.velocity);
                
                // Call the imported collision resolution function
                resolveBallCollision(ball1, ball2, RESTITUTION, BALL_RADIUS);
            }
        }
    }


    renderer.render(scene, camera);
}
animate();

// Add an event listener for window resize
window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Mouse Controls Functions ---
function getMouseTableIntersection(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(tablePlane, target)) {
        return target;
    }
    return null; // Should not happen if camera looks at table
}

window.addEventListener('mousemove', (event) => {
    if (shotInProgress || !currentPlayerCueBall || isDraggingForPower) {
        // If shot in progress, no cue ball, or dragging for power, don't aim.
        // Cue might be visible during power drag, but its direction is fixed.
        return;
    }

    if (currentPlayerCueBall.userData.velocity.lengthSq() < CUE_BALL_STOPPED_THRESHOLD) {
        const intersectionPoint = getMouseTableIntersection(event);
        if (intersectionPoint) {
            aimingDirection.subVectors(intersectionPoint, currentPlayerCueBall.position);
            aimingDirection.y = 0; // Ensure aiming is parallel to the table surface
            aimingDirection.normalize();

            cueStick.visible = true;
            
            // Position cue behind the ball, pointing in aimingDirection
            const cuePosition = currentPlayerCueBall.position.clone()
                .addScaledVector(aimingDirection, -CUE_OFFSET_DISTANCE); // Offset slightly behind
            cueStick.position.copy(cuePosition);

            // Orient cue to point towards the aiming direction
            // Look at a point far along the aiming direction from the cue's own position
            const lookAtPoint = cueStick.position.clone().add(aimingDirection);
            cueStick.lookAt(lookAtPoint);
        }
    } else {
        cueStick.visible = false; // Hide cue if cue ball is moving
    }
});

window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Only left click

    if (!shotInProgress && currentPlayerCueBall && 
        currentPlayerCueBall.userData.velocity.lengthSq() < CUE_BALL_STOPPED_THRESHOLD && 
        cueStick.visible) {
        
        isDraggingForPower = true;
        startMouseCoords.set(event.clientX, event.clientY);
        // Aiming direction is already set by the last mousemove
        console.log("Mousedown: Start power selection. Direction:", aimingDirection);
        // Optional: Visual cue for power selection start (e.g., slight cue movement)
        // cueStick.position.addScaledVector(aimingDirection, -0.1); // Example: retract slightly
    }
});

window.addEventListener('mousemove', (event) => {
    // This listener is distinct from the aiming one. This one handles power drag.
    if (!isDraggingForPower) return;

    const dragDistance = startMouseCoords.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    let currentPower = Math.min(dragDistance * POWER_SCALE_FACTOR, MAX_SHOT_POWER);
    
    // Visual feedback for power: move cue further back
    const cuePosition = currentPlayerCueBall.position.clone()
        .addScaledVector(aimingDirection, -CUE_OFFSET_DISTANCE - (currentPower * 0.05) ); // Scale retraction for visual feedback
    cueStick.position.copy(cuePosition);
    // cueStick.lookAt(cueStick.position.clone().add(aimingDirection)); // Keep it looking forward

}, true); // Use capture phase for this specific mousemove during drag to avoid conflicts if any

window.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return; // Only left click

    if (isDraggingForPower) {
        const endMouseCoords = new THREE.Vector2(event.clientX, event.clientY);
        const dragDistance = startMouseCoords.distanceTo(endMouseCoords);
        let shotPower = Math.min(dragDistance * POWER_SCALE_FACTOR, MAX_SHOT_POWER);

        if (shotPower < 0.1) { // Minimum power to avoid accidental tiny taps if not desired
            shotPower = 0.1; 
            console.log("Shot power too low, using minimum.");
        }

        console.log(`Shooting with Power: ${shotPower.toFixed(2)}, Direction: (${aimingDirection.x.toFixed(2)}, ${aimingDirection.y.toFixed(2)}, ${aimingDirection.z.toFixed(2)})`);

        currentPlayerCueBall.userData.velocity.copy(aimingDirection).multiplyScalar(shotPower);
        
        shotInProgress = true;
        ballsHitThisShot.clear(); // Clear for the new shot
        cueStick.visible = false;
        isDraggingForPower = false;
        
        console.log("Shot taken. Cue ball velocity:", currentPlayerCueBall.userData.velocity);
    }
});
