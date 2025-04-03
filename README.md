# 🎨 Design Portfolio

This is a Next.js portfolio project featuring a dynamic, interactive thread background using `p5.js` via `react-p5`. It includes subtle spring physics, stickiness between threads, and mouse-based repulsion to create an engaging visual experience.

---

## ✨ Features

- **Interactive Thread Background**  
  Simulates gravity, spring forces, stickiness, and smooth repulsion based on mouse input.

- **Framer Motion Header**  
  A subtle animated name/logo effect on hover.

- **Responsive and Performant**  
  Thread animation is hidden on mobile for performance.

- **Tailwind CSS**  
  Utility-first styling.

---

## 📁 Project Structure

| File                      | Description                                   |
|---------------------------|-----------------------------------------------|
| `page.js`                | Main Next.js page. Imports header and background. |
| `Header.js`              | Navigation header with animated logo.         |
| `ThreadBackground.js`    | All the p5 sketch logic for animated threads. |
| `globals.css`            | Global styles and Tailwind import.            |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd design-portfolio
npm install
