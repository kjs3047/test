/**
 * Resolves the collision between two balls, updating their velocities.
 * Assumes ball objects have position (THREE.Vector3), velocity (THREE.Vector3), and mass (number) properties.
 * Modifies the velocity properties of the ball objects directly.
 *
 * @param {object} ball1 - The first ball object.
 * @param {object} ball2 - The second ball object.
 * @param {number} restitution - The coefficient of restitution (bounciness).
 * @param {number} ballRadius - The radius of the balls (used for overlap resolution).
 */
function resolveBallCollision(ball1, ball2, restitution, ballRadius) {
    if (!ball1 || !ball2 || !ball1.position || !ball2.position || !ball1.userData.velocity || !ball2.userData.velocity || ball1.userData.mass === undefined || ball2.userData.mass === undefined) {
        console.error("Invalid ball objects passed to resolveBallCollision");
        return;
    }

    const normal = new THREE.Vector3().subVectors(ball2.position, ball1.position);
    const distance = normal.length();
    normal.normalize();

    // Relative velocity
    const vRel = new THREE.Vector3().subVectors(ball1.userData.velocity, ball2.userData.velocity);

    // Calculate new velocities along the normal (1D elastic collision formula)
    const v1 = ball1.userData.velocity;
    const v2 = ball2.userData.velocity;
    const m1 = ball1.userData.mass;
    const m2 = ball2.userData.mass;

    const v1n_scalar = v1.dot(normal);
    const v2n_scalar = v2.dot(normal);

    // Derived from conservation of momentum and definition of restitution
    const v1n_new_scalar = (v1n_scalar * (m1 - restitution * m2) + (1 + restitution) * m2 * v2n_scalar) / (m1 + m2);
    const v2n_new_scalar = (v2n_scalar * (m2 - restitution * m1) + (1 + restitution) * m1 * v1n_scalar) / (m1 + m2);

    // Convert scalar normal velocities back to vectors and apply the change
    const v1n_diff_vec = normal.clone().multiplyScalar(v1n_new_scalar - v1n_scalar);
    const v2n_diff_vec = normal.clone().multiplyScalar(v2n_new_scalar - v2n_scalar);

    ball1.userData.velocity.add(v1n_diff_vec);
    ball2.userData.velocity.add(v2n_diff_vec);

    // Overlap resolution
    const overlap = 2 * ballRadius - distance;
    if (overlap > 0.001) { // Only correct if overlap is significant
        const correction = normal.clone().multiplyScalar(overlap / 2); // Each ball moves by half the overlap
        ball1.position.sub(correction);
        ball2.position.add(correction);
    }
}

/**
 * Calculates the score for a given shot based on the balls hit by the cue ball.
 *
 * @param {Set<object>} ballsHitThisShotSet - A Set of ball objects that were hit by the cue ball.
 * @param {object} currentCueBall - The cue ball object.
 * @param {string[]} objectBallColorNamesArray - An array of color names that count as object balls (e.g., ['yellow', 'red1', 'red2']).
 * @returns {number} - The score for this shot (e.g., 1 if two object balls hit, 0 otherwise).
 */
function computeScoreForShot(ballsHitThisShotSet, currentCueBall, objectBallColorNamesArray) {
    if (!(ballsHitThisShotSet instanceof Set)) {
        console.error("Invalid ballsHitThisShotSet: not a Set");
        return 0;
    }
     if (!currentCueBall || !currentCueBall.userData || !currentCueBall.userData.colorName) {
        console.error("Invalid currentCueBall object");
        return 0;
    }

    let objectBallsHitCount = 0;
    let hitBallDescriptions = []; // For logging/debugging, not strictly needed for score

    ballsHitThisShotSet.forEach(hitBall => {
        if (hitBall !== currentCueBall && hitBall.userData && hitBall.userData.colorName) {
            hitBallDescriptions.push(hitBall.userData.colorName); // For debug log
            if (objectBallColorNamesArray.includes(hitBall.userData.colorName)) {
                objectBallsHitCount++;
            }
        }
    });
    
    // For debugging, can be removed or handled by caller
    // console.log(`computeScoreForShot: Cue ball (${currentCueBall.userData.colorName}) hit: ${hitBallDescriptions.join(', ') || 'nothing'}. Object balls hit: ${objectBallsHitCount}`);

    if (objectBallsHitCount >= 2) {
        return 1; // Scored a point
    }
    return 0; // No point
}

// Constants that might be needed by the functions if not passed directly
// const BALL_RADIUS = 0.15; // Example, should be passed or defined if used by resolveBallCollision for overlap
// const RESTITUTION = 0.8; // Example

// If we want to use these in a module context later, we would use:
// export { resolveBallCollision, computeScoreForShot };
// For now, they are global in tests.html context.
