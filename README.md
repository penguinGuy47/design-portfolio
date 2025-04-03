<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Design Portfolio - README</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 24px;
      padding: 0;
      line-height: 1.5;
    }
    code {
      background-color: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }
    pre {
      background-color: #f4f4f4;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>

  <h1>Design Portfolio</h1>
  <p>
    This is a Next.js project showcasing an interactive thread-based background
    using <code>react-p5</code> and <code>p5.js</code>. It also features a simple
    header and sample layout to highlight how the background and page elements
    interact.
  </p>

  <hr />

  <h2>Key Features</h2>
  <ul>
    <li>
      <strong>Interactive Thread Background</strong>:
      Uses spring physics, stickiness, and mouse-based repulsion to create
      animated threads.  
    </li>
    <li>
      <strong>Framer Motion Header</strong>:
      Demonstrates a fun hover effect for the site’s branding text.
    </li>
    <li>
      <strong>Tailwind CSS</strong>:
      For styling and responsive design.
    </li>
    <li>
      <strong>Mobile Detection</strong>:
      Hides the animated background on small screens for performance reasons.
    </li>
  </ul>

  <hr />

  <h2>Project Structure</h2>
  <p>The main files in this project are:</p>
  <ul>
    <li>
      <code>page.js</code> — The Next.js page entry point, which imports
      <code>Header</code> and <code>ThreadBackground</code>.
    </li>
    <li>
      <code>Header.js</code> — Displays the top navigation with
      Framer Motion effects.
    </li>
    <li>
      <code>ThreadBackground.js</code> — Contains the <code>react-p5</code>
      sketch logic for rendering and animating the threads.
    </li>
    <li>
      <code>globals.css</code> — Global styling and Tailwind imports.
    </li>
    <li>
      <code>tailwind.config.js</code> — (if present) The Tailwind configuration file.
    </li>
  </ul>

  <hr />

  <h2>Prerequisites</h2>
  <ul>
    <li>Node.js (version 16 or above recommended)</li>
    <li>npm or yarn (for package management)</li>
  </ul>

  <hr />

  <h2>Installation &amp; Setup</h2>
  <ol>
    <li>
      Clone this repository:
      <pre><code>git clone &lt;repo-url&gt;</code></pre>
    </li>
    <li>
      Navigate to the project folder and install dependencies:
      <pre><code>cd design-portfolio
npm install
      </code></pre>
    </li>
    <li>
      Start the development server:
      <pre><code>npm run dev
      </code></pre>
      The project will be accessible at <a href="http://localhost:3000">http://localhost:3000</a>.
    </li>
  </ol>

  <hr />

  <h2>Usage</h2>
  <p>
    Once the server is running, open the app in your browser. You will see:
  </p>
  <ul>
    <li>A top header with simple navigation and hover animations.</li>
    <li>A dynamic thread background that responds to:
      <ul>
        <li><strong>Gravity</strong> pulling threads downward</li>
        <li><strong>Noise forces</strong> adding subtle jitter</li>
        <li><strong>Stickiness</strong> causing neighboring particles to clump slightly</li>
        <li><strong>Mouse repulsion</strong> when you hold down the mouse button (click or touch)
            within a certain radius
        </li>
      </ul>
    </li>
  </ul>

  <hr />

  <h2>Configuration</h2>
  <p>
    You can modify simulation parameters in <code>ThreadBackground.js</code>.
    For example:
  </p>
  <ul>
    <li>
      <code>repulsionStrength</code> — How strongly each thread or particle is pushed away.
    </li>
    <li>
      <code>stiffness</code> — How “springy” the links are between consecutive particles.
    </li>
    <li>
      <code>gravity</code> — Downward acceleration on each free particle.
    </li>
    <li>
      <code>numThreads</code> &amp; <code>particlesPerThread</code> — How many vertical
      threads and how many particles per thread to display.
    </li>
    <li>
      <code>repulsionRadius</code> — How large the mouse repulsion area is.
    </li>
  </ul>

  <hr />

  <h2>Deployment</h2>
  <ol>
    <li>
      Build the optimized production version:
      <pre><code>npm run build
      </code></pre>
    </li>
    <li>
      Start the production server:
      <pre><code>npm run start
      </code></pre>
    </li>
    <li>Deploy your app to a hosting environment (e.g., Vercel, Netlify) that supports Next.js.</li>
  </ol>

  <hr />

  <h2>License</h2>
  <p>
    This project is open-source. You may adapt or use the code as needed.
    Any custom licensing terms should go here.
  </p>

  <hr />

  <h2>Contributions and Feedback</h2>
  <p>
    Feedback and pull requests are welcome. 
    You can fork the repository or open an issue for any suggestions or bug reports.
  </p>

</body>
</html>
