const puzzleGrid = document.getElementById('puzzle-grid');
const winModal = document.getElementById('win-modal');

// Game State
let tiles = []; // Logic state: tiles[gridIndex] = tileValue (0-8)
let tileElements = {}; // Map: tileValue -> DOM Element
let isSolved = false;

// Configuration Defaults (will be updated from CSS)
const gridSize = 3;
const totalTiles = gridSize * gridSize;
let tileSize = 100;
let gapSize = 4;

// Initialize
function initGame() {
    // 1. Get initial dimensions from CSS
    updateDimensions();

    // 2. Create solved state for logic
    const solvedState = Array.from({ length: totalTiles }, (_, i) => i);
    tiles = [...solvedState];

    // 3. Create DOM elements once
    createTileElements();

    // 4. Shuffle logic
    shuffleBoard(tiles);

    // 5. Update visual positions
    updateTilePositions();

    // 6. Listen for window resize
    window.addEventListener('resize', handleResize);
}

function updateDimensions() {
    const computedStyle = getComputedStyle(document.documentElement);
    // Parse '100px' -> 100
    const rawTile = computedStyle.getPropertyValue('--tile-size').trim();
    const rawGap = computedStyle.getPropertyValue('--gap-size').trim();

    tileSize = parseInt(rawTile, 10) || 100;
    gapSize = parseInt(rawGap, 10) || 4;
}

function handleResize() {
    updateDimensions();
    updateTilePositions();
}

function createTileElements() {
    puzzleGrid.innerHTML = '';

    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');

        if (i === totalTiles - 1) {
            tile.classList.add('empty');
            // CSS handles appearance, but we need to ensure pointer events are correct
        } else {
            // Background position (static based on value)
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            // 0 -> 0%, 1 -> 50%, 2 -> 100%
            const xPos = col * 50;
            const yPos = row * 50;
            tile.style.backgroundPosition = `${xPos}% ${yPos}%`;

            // Click listener
            tile.addEventListener('click', () => handleTileClick(i));
        }

        tileElements[i] = tile; // Store ref
        puzzleGrid.appendChild(tile);
    }
}

function shuffleBoard(boardState) {
    let emptyIdx = boardState.indexOf(totalTiles - 1);
    let previousIdx = -1;
    const shuffleMoves = 150;

    for (let i = 0; i < shuffleMoves; i++) {
        const neighbors = getNeighbors(emptyIdx);
        const validNeighbors = neighbors.filter(idx => idx !== previousIdx);
        // If deadend (unlikely), just pick any neighbor
        const candidates = validNeighbors.length > 0 ? validNeighbors : neighbors;

        const randomNeighbor = candidates[Math.floor(Math.random() * candidates.length)];

        // Swap logic
        [boardState[emptyIdx], boardState[randomNeighbor]] = [boardState[randomNeighbor], boardState[emptyIdx]];

        previousIdx = emptyIdx;
        emptyIdx = randomNeighbor;
    }
}

function getNeighbors(index) {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const neighbors = [];

    if (row > 0) neighbors.push(index - gridSize);
    if (row < gridSize - 1) neighbors.push(index + gridSize);
    if (col > 0) neighbors.push(index - 1);
    if (col < gridSize - 1) neighbors.push(index + 1);

    return neighbors;
}

function updateTilePositions() {
    tiles.forEach((tileValue, gridIndex) => {
        const tileEl = tileElements[tileValue];

        // Calculate position in pixels using current dimensions
        const row = Math.floor(gridIndex / gridSize);
        const col = gridIndex % gridSize;

        // x = col * (size + gap)
        const x = col * (tileSize + gapSize);
        const y = row * (tileSize + gapSize);

        tileEl.style.transform = `translate(${x}px, ${y}px)`;
    });
}

function handleTileClick(clickedTileValue) {
    if (isSolved) return;

    // Find where the clicked tile is currently sitting
    const currentGridIndex = tiles.indexOf(clickedTileValue);

    // Find where the empty slot is
    const emptyGridIndex = tiles.indexOf(totalTiles - 1);

    // Check adjacency
    const neighbors = getNeighbors(emptyGridIndex);

    if (neighbors.includes(currentGridIndex)) {
        // Swap in logic state
        [tiles[emptyGridIndex], tiles[currentGridIndex]] = [tiles[currentGridIndex], tiles[emptyGridIndex]];

        // Update visuals
        updateTilePositions();

        // Check win
        checkWin();
    }
}

function checkWin() {
    const isWin = tiles.every((val, index) => val === index);

    if (isWin) {
        isSolved = true;
        setTimeout(() => {
            // Fill empty slot with the missing piece
            const emptyTile = tileElements[totalTiles - 1];

            // Adjust styles to show the piece
            emptyTile.classList.remove('empty');

            // Background position for the last piece (bottom right) is 100% 100%
            emptyTile.style.background = `url('image.jpg')`;
            emptyTile.style.backgroundPosition = '100% 100%';

            // Re-calculate background size based on current grid size
            // Grid size = 3 * tile + 2 * gap
            const currentGridSize = (tileSize * 3) + (gapSize * 2);
            emptyTile.style.backgroundSize = `${currentGridSize}px ${currentGridSize}px`;

            emptyTile.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            emptyTile.style.cursor = 'default';

            emptyTile.style.opacity = 0;

            // Trigger fade in
            // Force reflow
            void emptyTile.offsetWidth;

            emptyTile.style.transition = 'opacity 0.5s ease';
            emptyTile.style.opacity = 1;

            // Show modal after piece appears
            setTimeout(() => {
                winModal.classList.add('active');
            }, 800);

        }, 300);
    }
}

// Start
initGame();
