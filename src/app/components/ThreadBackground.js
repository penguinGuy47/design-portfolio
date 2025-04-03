import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import react-p5 to avoid SSR issues
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
  ssr: false,
});

const ThreadBackground = () => {
  let threads = [];
  const numThreads = 60;
  const particlesPerThread = 30;
  const stiffness = 1.2;
  const gravity = 0.1;
  const noiseScale = 0.01;
  const noiseSpeed = 0.01;
  const stickinessThreshold = 3;
  const stickinessStrength = 0.02;
  const timeStep = 0.7;
  const damping = 0.4;
  
  // Modify these parameters for better stability
  const maxStretchFactor = 1.3;
  const repulsionStrength = 15;
  
  // Mouse repulsion parameters
  const repulsionRadius = 250;
  const repulsionResponse = 2.0;
  const repulsionFalloff = 2.5;

  // Spatial partitioning grid
  const gridSize = 50;
  const grid = {};

  // Setup function for p5.js
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.frameRate(30); // Limit frame rate for performance

    // Initialize threads
    for (let i = 0; i < numThreads; i++) {
        const thread = [];
        const xStart = (i / numThreads) * p5.width;
        
        // Create particles with first one at top edge and last one at bottom edge
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
  };

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

  // Add this function with improved constraint logic
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

    const applyMouseRepulsion = (p5) => {
        if (!p5.mouseIsPressed) return;

        threads.forEach((thread) => {
            thread.forEach((particle, index) => {
                if (particle.fixed) return;

                // Limit repulsion effect on sequential particles to maintain thread integrity
                const neighborCount = 
                    (index > 0 && thread[index-1].repulsed ? 1 : 0) + 
                    (index < thread.length-1 && thread[index+1].repulsed ? 1 : 0);

                if (neighborCount >= 2) {
                    // Skip if too many neighbors already affected
                    return;
                }

                const dist = p5.dist(particle.pos.x, particle.pos.y, p5.mouseX, p5.mouseY);
                if (dist < repulsionRadius && dist > 0) {
                    // Mark as repulsed for this frame
                    particle.repulsed = true;
                    // Smooth falloff
                    const falloff = Math.pow(1 - dist / repulsionRadius, repulsionFalloff);
                    let forceMagnitude = repulsionStrength * falloff;

                    const direction = p5.createVector(particle.pos.x - p5.mouseX, particle.pos.y - p5.mouseY);
                    direction.normalize();

                    // Apply more consistent, smoother position adjustment
                    const immediateOffset = direction.copy().mult(repulsionResponse * falloff * 2.0);
                    particle.pos.lerp(particle.pos.copy().add(immediateOffset), 0.5);
                    particle.pos.add(immediateOffset.mult(0.8));

                    // Update previous position proportionally to create damped response
                    particle.prevPos.add(immediateOffset.mult(0.8));

                    // Apply smaller acceleration component
                    const repulsionForce = direction.mult(Math.min(forceMagnitude * 1.5, 5));
                    particle.acc.add(repulsionForce);
                } else {
                    particle.repulsed = false;
                }
            });
        });
    };

  // Draw function for p5.js (runs every frame)
  const draw = (p5) => {
    p5.background(0);

    // Clear repulsed flags
    threads.forEach(thread => thread.forEach(particle => particle.repulsed = false));
    
    // Apply constraints before physics update
    enforceConstraints(p5, threads);
    
    updateGrid(p5);
    applyMouseRepulsion(p5);

    threads.forEach((thread) => {
      for (let i = 0; i < thread.length; i++) {
        const particle = thread[i];
        if (particle.fixed) continue;

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

        if (i > 0) {
          const prev = thread[i - 1];
          const dist = p5.dist(particle.pos.x, particle.pos.y, prev.pos.x, prev.pos.y);
          const restLength = p5.height / particlesPerThread;
          const springForce = (dist - restLength) * stiffness;
          const direction = p5.createVector(prev.pos.x - particle.pos.x, prev.pos.y - particle.pos.y);
          direction.normalize();
          particle.acc.add(direction.mult(springForce));
        }
        if (i < thread.length - 1) {
          const next = thread[i + 1];
          const dist = p5.dist(particle.pos.x, particle.pos.y, next.pos.x, next.pos.y);
          const restLength = p5.height / particlesPerThread;
          const springForce = (dist - restLength) * stiffness;
          const direction = p5.createVector(next.pos.x - particle.pos.x, next.pos.y - particle.pos.y);
          direction.normalize();
          particle.acc.add(direction.mult(springForce));
        }

        const newPos = p5.createVector(
          2 * particle.pos.x - particle.prevPos.x + particle.acc.x * timeStep * timeStep,
          2 * particle.pos.y - particle.prevPos.y + particle.acc.y * timeStep * timeStep
        );
        particle.prevPos.set(particle.pos);
        particle.pos.set(newPos);
        particle.acc.mult(0);

        const velocity = p5.createVector(
          particle.pos.x - particle.prevPos.x,
          particle.pos.y - particle.prevPos.y
        );
        velocity.mult(damping);
        particle.prevPos.set(particle.pos.x - velocity.x, particle.pos.y - velocity.y);

        if (particle.pos.x < 0) particle.pos.x = 0;
        if (particle.pos.x > p5.width) particle.pos.x = p5.width;
        if (particle.pos.y < 0) particle.pos.y = 0;
        if (particle.pos.y > p5.height) particle.pos.y = p5.height;

        if (i > 0) {
          const prev = thread[i - 1];
          const dist = p5.dist(particle.pos.x, particle.pos.y, prev.pos.x, prev.pos.y);
          const restLength = p5.height / particlesPerThread;
          if (dist > restLength * 1.5) {
            const direction = p5.createVector(particle.pos.x - prev.pos.x, particle.pos.y - prev.pos.y);
            direction.normalize();
            const correction = (dist - restLength) / 2;
            particle.pos.sub(direction.mult(correction));
            if (!prev.fixed) prev.pos.add(direction.mult(correction));
          }
        }
      }

      p5.stroke(255, 100);
      p5.noFill();
      p5.beginShape();

      const firstPoint = thread[0];
      p5.curveVertex(firstPoint.pos.x, firstPoint.pos.y);

      thread.forEach((particle) => {
        p5.curveVertex(particle.pos.x, particle.pos.y);
      });

      const lastPoint = thread[thread.length - 1];
      p5.curveVertex(lastPoint.pos.x, lastPoint.pos.y);

      p5.endShape();
    });

    // Debug: Draw repulsion radius
    p5.noFill();
    p5.stroke(255, 0, 0, 50);
    p5.ellipse(p5.mouseX, p5.mouseY, repulsionRadius * 1, repulsionRadius * 1);

    // Apply constraints again after physics update
    enforceConstraints(p5, threads);
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }}>
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default ThreadBackground;