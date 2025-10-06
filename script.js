window.addEventListener("DOMContentLoaded", () => {
    // 🎵 Background audio setup
    const backgroundAudio = new Audio("audio/backgroundaudio.mp3");
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.5;
    backgroundAudio.preload = "auto";
  
    const toggleButton = document.getElementById("audio-toggle");
    let isPlaying = false;
  
    // Unlock audio on first user gesture
    const unlock = () => {
      backgroundAudio.play().then(() => {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
        console.log("Audio unlocked ✅");
        document.removeEventListener("click", unlock);
        document.removeEventListener("keydown", unlock);
      }).catch(() => {});
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
  
    // Toggle play/pause
    toggleButton.addEventListener("click", async () => {
      try {
        if (!isPlaying) {
          await backgroundAudio.play();
          isPlaying = true;
          toggleButton.textContent = "🔇 Stop";
        } else {
          backgroundAudio.pause();
          isPlaying = false;
          toggleButton.textContent = "🔊 Play";
        }
      } catch (err) {
        console.warn("Still blocked:", err);
      }
    });
  
    // ✅ Only ONE lyric physics setup
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } = Matter;
  
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
  
    const canvas = document.getElementById("lyricCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    const render = Render.create({
      canvas,
      engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: "transparent",
        wireframes: false
      }
    });
  
    Render.run(render);
    Runner.run(Runner.create(), engine);
  
    // Ground
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 10, window.innerWidth, 40, { isStatic: true });
    World.add(world, ground);
  
    // Mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.1, render: { visible: false } }
    });
    World.add(world, mouseConstraint);

    function spawnLyric(lyric) {
        const fontSize = 20 + Math.random() * 40;
        const fontColor = Math.random() < 0.5 ? "black" : "#b3b3b3";
      
        // Measure text width roughly based on character count
        const textWidth = lyric.length * (fontSize * 0.6);
        const safeMargin = 100;
        const maxX = window.innerWidth - textWidth - safeMargin;
      
        // Prevent off-screen spawn
        const startX = Math.max(safeMargin, Math.random() * maxX);
        const startY = 100;
      
        const bodies = [];
      
        lyric.split("").forEach((ch, i) => {
          const body = Bodies.circle(startX + i * (fontSize * 0.6), startY, 10, {
            restitution: 0.7,
            friction: 0.1,
            render: { fillStyle: fontColor }
          });
          body.labelText = ch;
          body.fontSize = fontSize;
          body.fontColor = fontColor;
          body.alpha = 1.0;
          World.add(world, body);
          bodies.push(body);
        });
      
        // Fade out + remove
        setTimeout(() => {
          const fadeInterval = setInterval(() => {
            let allGone = true;
            for (const b of bodies) {
              b.alpha -= 0.05;
              if (b.alpha > 0) allGone = false;
            }
            if (allGone) {
              clearInterval(fadeInterval);
              bodies.forEach(b => World.remove(world, b));
            }
          }, 100);
        }, 2500);
      }
      

      (function renderText() {
        const ctx = render.context;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const body of world.bodies) {
          if (body.labelText) {
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            ctx.font = `${body.fontSize || 30}px "Swear Display"`;
            const color = body.fontColor || "black";
            const alpha = body.alpha !== undefined ? Math.max(0, body.alpha) : 1;
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      
            // If it’s grey, use grey RGBA instead
            if (color !== "black") ctx.fillStyle = `rgba(179,179,179,${alpha})`;
      
            ctx.fillText(body.labelText, -5, 5);
            ctx.restore();
          }
        }
        requestAnimationFrame(renderText);
      })();
      
      
    // One-time event listener for lyrics
    window.addEventListener("lyricSpawn", e => spawnLyric(e.detail));
  
    // 🎨 Infinite tiles setup
    const gridContainer = document.getElementById("grid-container");
    const TILE_SIZE = 50;
    const buffer = 2;
    let visibleCells = {};
    const CELL_IMAGE_POSITIONS = {};
  
    const images = Array.from({ length: 72 }, (_, i) => ({ src: `pictures/${i + 1}.jpeg` }));
    const audioSamples = Array.from({ length: 11 }, (_, i) => `audio/audio ${i + 1}.mp3`);
    const lyrics = [
        "Ticking away the moments that make up a dull day",
        "And you run and you run to catch up with the sun but it's sinking", 
        "Every year is getting shorter", 
        "Never seem to find the time",
        "The time is gone", "the song is over", "thought I'd something more to say",];

    const predefinedShapes = ["shape-1", "shape-2", "shape-3", "shape-4", "shape-5"];
  
    function randomCrackedPolygon() {
      const type = Math.random() < 0.5 ? "square" : "diamond";
      let points = type === "square" ? [[0,0],[1,0],[1,1],[0,1]] : [[0.5,0],[1,0.5],[0.5,1],[0,0.5]];
      points = points.map(([x,y]) => [0.2 + x*0.6 + (Math.random()-0.5)*0.1, 0.2 + y*0.6 + (Math.random()-0.5)*0.1]);
      if (Math.random() < 0.6) {
        let i = Math.floor(Math.random() * points.length);
        let j = (i + 1) % points.length;
        let mid = [(points[i][0]+points[j][0])/2 + (Math.random()-0.5)*0.1, (points[i][1]+points[j][1])/2 + (Math.random()-0.5)*0.1];
        points.splice(j,0,mid);
      }
      return points.map(([x,y]) => `${Math.min(100,Math.max(0,x*100))}% ${Math.min(100,Math.max(0,y*100))}%`).join(",");
    }
  
    function randomTile(row,col){
      const div = document.createElement("div");
      div.className = "tile";
      div.style.top = row*TILE_SIZE + "px";
      div.style.left = col*TILE_SIZE + "px";
      div.style.background = Math.random() > 0.5 ? "#dbd7d7" : "#fff";
      if (Math.random() < 0.6) div.classList.add(predefinedShapes[Math.floor(Math.random()*predefinedShapes.length)]);
      else div.style.clipPath = "polygon(" + randomCrackedPolygon() + ")";
      return div;
    }
  
    function makeDraggable(el) {
      let isDragging = false;
      let offsetX, offsetY;
  
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.cursor = "grabbing";
        el.style.zIndex = 9999;
        document.body.style.userSelect = "none";
      });
  
      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = e.clientX - offsetX + "px";
        el.style.top = e.clientY - offsetY + "px";
      });
  
      window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        el.style.cursor = "grab";
        el.style.zIndex = "";
        document.body.style.userSelect = "";
      });
    }
  
    function maybePlaceMacauImage(row, col) {
      if (Math.random() < 0.01) {
        const choice = images[Math.floor(Math.random()*images.length)];
        const img = document.createElement("img");
        img.className = "macau-tile";
        img.draggable = false;
        img.src = choice.src;
  
        const scale = 0.5 + Math.random() * 0.5;
        img.style.transform = `translate(-50%, -50%) scale(${scale})`;
  
        const cellKey = `${row},${col}`;
        if (!CELL_IMAGE_POSITIONS[cellKey]) CELL_IMAGE_POSITIONS[cellKey] = [];
  
        let offsetX = (Math.random() - 0.5) * TILE_SIZE * 3;
        let offsetY = (Math.random() - 0.5) * TILE_SIZE * 3;
  
        img.style.top = row*TILE_SIZE + TILE_SIZE/2 + offsetY + "px";
        img.style.left = col*TILE_SIZE + TILE_SIZE/2 + offsetX + "px";
  
        img.addEventListener("mouseenter", () => {
          const randomAudio = audioSamples[Math.floor(Math.random() * audioSamples.length)];
          const audio = new Audio(randomAudio);
          audio.volume = 0.5;
          audio.play().catch(err => console.log("Playback blocked:", err));
        });
  
        img.addEventListener("click", () => {
          window.dispatchEvent(new CustomEvent("lyricSpawn", { detail: lyrics[Math.floor(Math.random() * lyrics.length)] }));
        });
  
        gridContainer.appendChild(img);
        makeDraggable(img);
        return img;
      }
    }
  
    function generateCell(row, col){
      const key = `${row},${col}`;
      if (visibleCells[key]) return;
      const tile = randomTile(row, col);
      gridContainer.appendChild(tile);
      const macauImg = maybePlaceMacauImage(row, col);
      visibleCells[key] = [tile];
      if (macauImg) visibleCells[key].push(macauImg);
    }
  
    function updateVisibleGrid(){
      const scrollTop = window.scrollY, scrollLeft = window.scrollX;
      const rowsInView = Math.ceil(window.innerHeight / TILE_SIZE);
      const colsInView = Math.ceil(window.innerWidth / TILE_SIZE);
      const currentRow = Math.floor(scrollTop / TILE_SIZE);
      const currentCol = Math.floor(scrollLeft / TILE_SIZE);
  
      const cellsToKeep = {};
      for (let r = currentRow-buffer; r <= currentRow+rowsInView+buffer; r++){
        for (let c = currentCol-buffer; c <= currentCol+colsInView+buffer; c++){
          generateCell(r,c);
          const key = `${r},${c}`;
          if (visibleCells[key]) cellsToKeep[key] = visibleCells[key];
        }
      }
  
      for (let key in visibleCells){
        if (!cellsToKeep[key]){
          visibleCells[key].forEach(el => el.remove());
          delete CELL_IMAGE_POSITIONS[key];
        }
      }
      visibleCells = cellsToKeep;
    }
  
    updateVisibleGrid();
    window.addEventListener("scroll", updateVisibleGrid);
  });
  