import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import react-p5 to avoid SSR issues
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

const ThreadBackground = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false); // State for touch detection

  let threads = [];
  const baseNumThreads = 60;
  const smallScreenFactor = 0.5;
  const mediumScreenFactor = 1.5; // Relative to small screen size

  // Breakpoints
  const smallBreakpoint = 768;
  const mediumBreakpoint = 1024;

  // Will be calculated dynamically based on device
  let numThreads;
  const particlesPerThread = 30;
  const stiffness = 0.01;
  const gravity = 0.1;
  const noiseScale = 0.01;
  const noiseSpeed = 0.01;
  const stickinessThreshold = 3;
  const stickinessStrength = 0.02;

  const timeStep = 0.75;
  const damping = 0.4;

  // Modify these parameters for better stability
  const maxStretchFactor = 1.0;
  const repulsionStrength = 15;

  // Mouse repulsion parameters
  const repulsionRadius = 250;
  const repulsionResponse = 1.2;
  const repulsionFalloff = 2.0;
  const wholeThreadRepulsion = true;

  // Spatial partitioning grid
  const gridSize = 50;
  const grid = {};

  // Setup function for p5.js
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.frameRate(30); // Limit frame rate for performance

    // Determine number of threads based on device
    numThreads = isMobile ? Math.floor(baseNumThreads * smallScreenFactor) : baseNumThreads;

    // Initialize threads
    initializeThreads(p5);
  };

  // Helper function to initialize threads
  const initializeThreads = (p5) => {
    threads = []; // Clear existing threads
    numThreads = isMobile ? Math.floor(baseNumThreads * smallScreenFactor) : baseNumThreads; // Recalculate based on current state

    for (let i = 0; i < numThreads; i++) {
        const thread = [];
        const xStart = (i / numThreads) * p5.width;

        for (let j = 0; j < particlesPerThread; j++) {
            const y = j === 0 ? 0 : j === particlesPerThread - 1 ? p5.height : (j / (particlesPerThread - 1)) * p5.height;
            thread.push({
                pos: p5.createVector(xStart, y),
                prevPos: p5.createVector(xStart, y),
                acc: p5.createVector(0, 0),
                fixed: j === 0 || j === particlesPerThread - 1,
            });
        }
        threads.push(thread);
    }
  }

  // Update the spatial partitioning grid and apply stickiness
  const updateGrid = (p5) => {
    Object.keys(grid).forEach((key) => delete grid[key]);
    threads.forEach((thread, tIndex) => {
      thread.forEach((particle, pIndex) => {
        if (particle.fixed) return;
        const gridX = Math.floor(particle.pos.x / gridSize);
        const gridY = Math.floor(particle.pos.y / gridSize);
        const key = `${gridX},${gridY}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push({ particle, tIndex, pIndex });
      });
    });

    threads.forEach((thread, tIndex) => {
      thread.forEach((particle, pIndex) => {
        if (particle.fixed) return;
        const gridX = Math.floor(particle.pos.x / gridSize);
        const gridY = Math.floor(particle.pos.y / gridSize);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const key = `${gridX + dx},${gridY + dy}`;
            if (grid[key]) {
              grid[key].forEach(({ particle: other, tIndex: otIndex, pIndex: opIndex }) => {
                if (tIndex === otIndex) return;
                if (other.fixed) return;
                const d = p5.dist(particle.pos.x, particle.pos.y, other.pos.x, other.pos.y);
                if (d < stickinessThreshold && d > 0) {
                  const force = p5.createVector(other.pos.x - particle.pos.x, other.pos.y - particle.pos.y);
                  force.normalize();
                  force.mult(stickinessStrength);
                  particle.acc.add(force);
                  other.acc.sub(force);
                }
              });
            }
          }
        }
      });
    });
  };

  // Enforce constraints to prevent threads from stretching too much
  const enforceConstraints = (p5, threads) => {
    const restLength = p5.height / particlesPerThread;
    const maxLength = restLength * maxStretchFactor;
    
    threads.forEach(thread => {
      // More passes for better stability
      for (let pass = 0; pass < 5; pass++) {
        // Enforce constraints from both ends to center for better stability
        // From top to bottom
        for (let i = 0; i < thread.length - 1; i++) {
          const current = thread[i];
          const next = thread[i + 1];
          
          const dx = next.pos.x - current.pos.x;
          const dy = next.pos.y - current.pos.y;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          
          if (currentDistance > maxLength || currentDistance < restLength * 0.5) {
            // Use target length to avoid oscillation
            const targetLength = Math.min(maxLength, restLength);
            
            // Create normalized direction vector
            const dirX = dx / currentDistance;
            const dirY = dy / currentDistance;
            
            // Force hard constraint by directly setting positions
            if (current.fixed && next.fixed) {
              // Both fixed, do nothing
            } else if (current.fixed) {
              // Only current is fixed, move next
              next.pos.x = current.pos.x + dirX * targetLength;
              next.pos.y = current.pos.y + dirY * targetLength;
              // Update previous position to maintain velocity
              next.prevPos.x = next.pos.x;
              next.prevPos.y = next.pos.y;
            } else if (next.fixed) {
              // Only next is fixed, move current
              current.pos.x = next.pos.x - dirX * targetLength;
              current.pos.y = next.pos.y - dirY * targetLength;
              // Update previous position to maintain velocity
              current.prevPos.x = current.pos.x;
              current.prevPos.y = current.pos.y;
            } else {
              // Both movable, share the correction
              const halfTargetLength = targetLength * 0.5;
              const midX = (current.pos.x + next.pos.x) * 0.5;
              const midY = (current.pos.y + next.pos.y) * 0.5;
              
              current.pos.x = midX - dirX * halfTargetLength;
              current.pos.y = midY - dirY * halfTargetLength;
              next.pos.x = midX + dirX * halfTargetLength;
              next.pos.y = midY + dirY * halfTargetLength;
              
              // Update previous positions to reduce oscillation
              current.prevPos.x = current.pos.x;
              current.prevPos.y = current.pos.y;
              next.prevPos.x = next.pos.x;
              next.prevPos.y = next.pos.y;
            }
          }
        }
      }
    });
  };

  // Add a function to apply repulsion to entire threads
  const applyInteractionRepulsion = (p5) => {
    let interactionX = -1;
    let interactionY = -1;
    let isInteracting = false;

    // Check for touch first if it's a touch device
    if (isTouchDevice && p5.touches.length > 0) {
        interactionX = p5.touches[0].x;
        interactionY = p5.touches[0].y;
        isInteracting = true;
    }
    // Otherwise, check for mouse press
    else if (p5.mouseIsPressed) {
        interactionX = p5.mouseX;
        interactionY = p5.mouseY;
        isInteracting = true;
    }

    if (!isInteracting) return; // No interaction, exit

    // Calculate which threads are affected by repulsion
    threads.forEach((thread, threadIndex) => {
      // Check if any part of thread is within repulsion radius
      let threadAffected = false;
      let closestDist = Infinity;
      let closestIndex = -1;
      let avgForceDirection = p5.createVector(0, 0);
      let totalAffectedPoints = 0;

      // First pass: determine if thread is affected and calculate average force
      thread.forEach((particle, index) => {
        const dist = p5.dist(particle.pos.x, particle.pos.y, interactionX, interactionY);
        if (dist < repulsionRadius) {
          threadAffected = true;
          totalAffectedPoints++;

          // Keep track of closest point
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = index;
          }

          // Calculate force direction
          const falloff = Math.pow(1 - dist / repulsionRadius, repulsionFalloff);
          const direction = p5.createVector(particle.pos.x - interactionX, particle.pos.y - interactionY);
          direction.normalize().mult(falloff);

          // Add to average force
          avgForceDirection.add(direction);

          // Mark as repulsed for visualization
          particle.repulsed = true;
        }
      });

      // If thread isn't affected, skip it
      if (!threadAffected) return;

      // Normalize the average force direction
      if (totalAffectedPoints > 0) {
        avgForceDirection.div(totalAffectedPoints);
        avgForceDirection.normalize();
      }

      // Apply repulsion to entire thread with falloff from closest point
      if (wholeThreadRepulsion) {
        const threadCenterIndex = Math.floor(thread.length / 2);

        thread.forEach((particle, index) => {
          if (particle.fixed) return;

          // Calculate distance-based falloff from closest affected point
          let distanceFromClosest = Math.abs(index - closestIndex);
          let falloff = Math.max(0, 1 - (distanceFromClosest / (thread.length * 0.5)));
          falloff = Math.pow(falloff, 1.5); // Sharpen falloff curve

          // Stronger effect in thread middle, weaker near anchors
          const verticalFalloff = Math.sin((index / (thread.length - 1)) * Math.PI);

          // Combine falloffs
          const combinedFalloff = falloff * verticalFalloff;

          // Calculate base force magnitude based on closest point
          const baseForce = Math.pow(1 - closestDist / repulsionRadius, repulsionFalloff) * repulsionStrength;
          const forceMagnitude = baseForce * combinedFalloff;

          // Create properly scaled force
          const force = avgForceDirection.copy().mult(forceMagnitude * repulsionResponse);

          // Apply position offset with smooth interpolation
          particle.pos.add(force);

          // Update previous position for velocity consistency
          particle.prevPos.add(force.copy().mult(0.75));

          // Add some force to acceleration for continued movement
          particle.acc.add(force.copy().mult(0.3));
        });
      } else {
        // Could not apply repulsion to entire thread
        throw new Error("Error in applyInteractionRepulsion");
      }
    });
  };

  // Draw function for p5.js (runs every frame)
  const draw = (p5) => {
    p5.background(0);

    // Only process if threads exist
    if (threads.length === 0) return;

    // Clear repulsed flags
    threads.forEach(thread => thread.forEach(particle => particle.repulsed = false));

    // Apply constraints *before* physics update for stability
    enforceConstraints(p5, threads);

    updateGrid(p5); // Update spatial grid for stickiness
    applyInteractionRepulsion(p5); // Apply mouse/touch interaction forces

    // Verlet integration and forces calculation
    threads.forEach((thread) => {
      const restLength = p5.height / particlesPerThread; // Calculate once per thread

      for (let i = 0; i < thread.length; i++) {
        const particle = thread[i];
        if (particle.fixed) continue;

        // Accumulate forces (Gravity, Noise, Springs)
        particle.acc.add(p5.createVector(0, gravity));

        const noiseVal = p5.noise(
          particle.pos.x * noiseScale,
          particle.pos.y * noiseScale,
          p5.frameCount * noiseSpeed
        );
        const noiseForce = p5.createVector(
          p5.map(noiseVal, 0, 1, -0.1, 0.1),
          p5.map(noiseVal, 0, 1, -0.1, 0.1)
        );
        particle.acc.add(noiseForce);

        // Spring forces (connections to neighbors)
        if (i > 0) {
          const prev = thread[i - 1];
          const dist = p5.dist(particle.pos.x, particle.pos.y, prev.pos.x, prev.pos.y);
          const springForce = (dist - restLength) * stiffness;
          const direction = p5.createVector(prev.pos.x - particle.pos.x, prev.pos.y - particle.pos.y);
          // Avoid division by zero if distance is exactly zero
          if (dist > 1e-6) {
              direction.normalize();
              particle.acc.add(direction.mult(springForce));
          }
        }
        if (i < thread.length - 1) {
          const next = thread[i + 1];
          const dist = p5.dist(particle.pos.x, particle.pos.y, next.pos.x, next.pos.y);
          const springForce = (dist - restLength) * stiffness;
          const direction = p5.createVector(next.pos.x - particle.pos.x, next.pos.y - particle.pos.y);
          // Avoid division by zero if distance is exactly zero
          if (dist > 1e-6) {
              direction.normalize();
              particle.acc.add(direction.mult(springForce));
          }
        }

        // Verlet Integration step
        const velocity = p5.createVector(
            (particle.pos.x - particle.prevPos.x) * (1.0 - damping), // Apply damping directly to velocity calculation
            (particle.pos.y - particle.prevPos.y) * (1.0 - damping)
        );
        particle.prevPos.set(particle.pos);
        particle.pos.add(velocity).add(particle.acc.mult(timeStep * timeStep));
        particle.acc.mult(0); // Reset acceleration

        // Screen bounds collision
        if (particle.pos.x < 0) particle.pos.x = 0;
        if (particle.pos.x > p5.width) particle.pos.x = p5.width;
        if (particle.pos.y < 0) particle.pos.y = 0;
        if (particle.pos.y > p5.height) particle.pos.y = p5.height;

      }

      // Draw the thread
      p5.stroke(255, 100);
      p5.noFill();
      p5.beginShape();
      // Draw curve using all points including anchors
      p5.curveVertex(thread[0].pos.x, thread[0].pos.y); // Repeat first point for Catmull-Rom start
      thread.forEach((particle) => {
        p5.curveVertex(particle.pos.x, particle.pos.y);
      });
      // Repeat last point for Catmull-Rom end
      p5.curveVertex(thread[thread.length - 1].pos.x, thread[thread.length - 1].pos.y);
      p5.endShape();
    });

    // Debug: Draw repulsion radius
    p5.noFill();
    p5.stroke(255, 0, 0, 50);
    let interactionX = -1, interactionY = -1;
    if (isTouchDevice && p5.touches.length > 0) {
        interactionX = p5.touches[0].x;
        interactionY = p5.touches[0].y;
        p5.ellipse(interactionX, interactionY, repulsionRadius * 2, repulsionRadius * 2);
    } else if (p5.mouseIsPressed) {
        interactionX = p5.mouseX;
        interactionY = p5.mouseY;
        p5.ellipse(interactionX, interactionY, repulsionRadius * 2, repulsionRadius * 2);
    }

    // Apply constraints *again* after physics update to ensure they are met
    enforceConstraints(p5, threads);
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    // Re-initialize threads completely on resize
    initializeThreads(p5);
  };

  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        // Only update state if it changes to avoid unnecessary re-renders/resets
        if (mobile !== isMobile) {
            setIsMobile(mobile);
        }
    };
    // Check for touch support once on mount
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);

    return () => {
        window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]); // Add isMobile dependency to re-run if it changes

  return (
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }}>
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default ThreadBackground;