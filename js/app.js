// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AR experience
    initializeAR();
});

function initializeAR() {
    // Hide loader when scene is loaded
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', function() {
        document.querySelector('.arjs-loader').style.display = 'none';
        
        // Start performance monitoring
        monitorPerformance();
    });
    
    // Setup surface scanning
    setupSurfaceScanning();
    
    // Setup gesture controls
    setupGestureControls();
    
    // Setup chest interaction
    setupChestInteraction();
    
    // Setup UI controls
    setupUIControls();
}

function monitorPerformance() {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    
    function updateFPS() {
        const currentTime = performance.now();
        frameCount++;
        
        if (currentTime - lastTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
            
            // Adjust quality based on FPS
            adjustQuality(fps);
        }
        
        requestAnimationFrame(updateFPS);
    }
    
    function adjustQuality(currentFPS) {
        const scene = document.querySelector('a-scene');
        const renderer = scene.renderer;
        
        if (currentFPS < 30) {
            // Reduce quality for better performance
            scene.setAttribute('renderer', 'antialias: false; precision: lowp');
        } else if (currentFPS > 50) {
            // Increase quality when performance is good
            scene.setAttribute('renderer', 'antialias: true; precision: mediump');
        }
    }
    
    // Start monitoring
    updateFPS();
}

function setupSurfaceScanning() {
    const scanButton = document.getElementById('scan-button');
    const placeButton = document.getElementById('place-button');
    const openButton = document.getElementById('open-button');
    const instructions = document.getElementById('instructions');
    const chestContainer = document.getElementById('chest-container');
    
    let surfaceScanned = false;
    let chestPlaced = false;
    
    // Initially hide place and open buttons
    placeButton.style.opacity = '0';
    openButton.style.opacity = '0';
    
    // Move chest off-screen initially
    chestContainer.setAttribute('position', '0 -10 0');
    
    // Scan button event
    scanButton.addEventListener('click', function() {
        // In a real implementation, this would start the AR surface detection
        // For now, we'll simulate it by enabling the place button
        surfaceScanned = true;
        scanButton.style.opacity = '0';
        placeButton.style.opacity = '1';
        instructions.textContent = 'Surface scanned! Tap on the surface to place the treasure chest.';
    });
    
    // Setup hit testing for markerless AR
    const scene = document.querySelector('a-scene');
    const groundPlane = document.getElementById('ground-plane');
    
    // Add event listener for tap/click to place chest
    scene.addEventListener('click', function (evt) {
        if (surfaceScanned && !chestPlaced && evt.detail.intersectedEl === groundPlane) {
            // Place chest at hit point
            const point = evt.detail.intersection.point;
            chestContainer.setAttribute('position', `${point.x} ${point.y} ${point.z}`);
            
            // Hide place button and show open button
            placeButton.style.opacity = '0';
            openButton.style.opacity = '1';
            
            // Update instructions
            instructions.textContent = 'Treasure chest placed! Tap OPEN to reveal your reward.';
            
            // Mark as placed
            chestPlaced = true;
            window.chestPlaced = true;
        }
    });
    
    // Add touch support for mobile
    scene.addEventListener('touchstart', function (evt) {
        if (evt.touches.length > 0 && surfaceScanned && !chestPlaced) {
            // Get touch position
            const touch = evt.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            scene.dispatchEvent(mouseEvent);
        }
    });
}

function setupGestureControls() {
    const chestContainer = document.getElementById('chest-container');
    let scale = 1;
    let isDragging = false;
    let lastX, lastY;
    
    // Prevent default touch behavior for better performance
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Pinch to zoom
    let initialDistance = 0;
    
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            // Calculate initial distance between fingers
            initialDistance = Math.sqrt(
                Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
                Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
            );
        } else if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
            // Pinch zoom
            e.preventDefault();
            const currentDistance = Math.sqrt(
                Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
                Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
            );
            
            if (initialDistance > 0) {
                const scaleChange = currentDistance / initialDistance;
                scale = Math.min(Math.max(0.5, scale * scaleChange), 2);
                chestContainer.setAttribute('scale', `${scale} ${scale} ${scale}`);
                initialDistance = currentDistance;
            }
        } else if (isDragging && e.touches.length === 1) {
            // Drag to move
            e.preventDefault();
            const deltaX = e.touches[0].clientX - lastX;
            const deltaY = e.touches[0].clientY - lastY;
            
            // Get current position
            const position = chestContainer.getAttribute('position');
            if (position) {
                // Update position (simplified for this example)
                chestContainer.setAttribute('position', {
                    x: position.x + deltaX * 0.01,
                    y: position.y - deltaY * 0.01,
                    z: position.z
                });
            }
            
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
        initialDistance = 0;
    });
}

function setupChestInteraction() {
    const chest = document.getElementById('treasure-chest');
    const openButton = document.getElementById('open-button');
    const chestContainer = document.getElementById('chest-container');
    let chestPlaced = false;
    
    // Chest opening logic
    let isOpen = false;
    openButton.addEventListener('click', function() {
        if (!isOpen && (chestPlaced || window.chestPlaced)) {
            openTreasureChest();
            isOpen = true;
            
            // Change button to reset after opening
            setTimeout(() => {
                openButton.textContent = 'PLACE NEW CHEST';
                openButton.style.opacity = '1';
                openButton.onclick = function() {
                    // Reset chest
                    chestContainer.setAttribute('position', '0 -10 0'); // Move off-screen
                    openButton.style.opacity = '0';
                    openButton.textContent = 'OPEN TREASURE';
                    isOpen = false;
                    window.chestPlaced = false;
                    document.getElementById('instructions').textContent = 'Click \'Scan Surface\' to begin';
                    
                    // Reset chest animation
                    chest.setAttribute('rotation', '0 0 0');
                    chest.removeAttribute('animation-mixer');
                    
                    // Reset UI flow
                    document.getElementById('scan-button').style.opacity = '1';
                };
            }, 3000);
        }
    });
}

function openTreasureChest() {
    const chest = document.getElementById('treasure-chest');
    const openButton = document.getElementById('open-button');
    const chestContainer = document.getElementById('chest-container');
    
    // Play opening animation
    chest.setAttribute('animation-mixer', 'clip: open');
    
    // Add specific lid rotation animation
    const lid = document.createElement('a-entity');
    lid.setAttribute('id', 'chest-lid');
    lid.setAttribute('position', '0 0.3 0');
    lid.setAttribute('animation', {
        property: 'rotation',
        from: '0 0 0',
        to: '-120 0 0',
        dur: 2000,
        easing: 'easeInOutQuad'
    });
    
    // Add glow effect
    chest.setAttribute('material', 'emissive: #ff8800; emissiveIntensity: 0.5');
    
    // Hide open button
    openButton.style.opacity = '0';
    
    // Add particle effects for magical appearance
    addParticleEffects();
    
    // Play sound effect
    playSound('open');
    
    // Show reward after delay
    setTimeout(showReward, 2000);
}

function playSound(type) {
    const instructions = document.getElementById('instructions');
    switch(type) {
        case 'open':
            document.getElementById('open-sound').currentTime = 0;
            document.getElementById('open-sound').play().catch(e => console.log("Audio play error:", e));
            instructions.textContent = '✨ Treasure chest opening! ✨';
            setTimeout(() => {
                instructions.textContent = '🎁 Reward revealed! 🎁';
            }, 1000);
            break;
        case 'close':
            document.getElementById('close-sound').currentTime = 0;
            document.getElementById('close-sound').play().catch(e => console.log("Audio play error:", e));
            instructions.textContent = '🔒 Treasure chest closed 🔒';
            break;
        case 'reward':
            document.getElementById('reward-sound').currentTime = 0;
            document.getElementById('reward-sound').play().catch(e => console.log("Audio play error:", e));
            break;
    }
}

function addParticleEffects() {
    const chestContainer = document.getElementById('chest-container');
    const particles = document.createElement('a-entity');
    particles.setAttribute('position', '0 0.5 0');
    particles.setAttribute('particle-system', {
        preset: 'dust',
        color: ['#FFD700', '#FFA500', '#FF6347'],
        particleCount: 100,
        duration: 2
    });
    chestContainer.appendChild(particles);
    
    // Remove particles after animation
    setTimeout(() => {
        chestContainer.removeChild(particles);
    }, 2000);
}

function showReward() {
    const rewardDisplay = document.getElementById('reward-display');
    const rewardImage = document.getElementById('reward-image');
    
    // Play reward sound
    playSound('reward');
    
    // Set random reward image (in a real app, this would come from a server)
    const rewards = [
        { image: 'https://placehold.co/400x300/FFD700/000000?text=Gold+Coins', title: 'Golden Coins', description: '1000 gold coins for your adventure!' },
        { image: 'https://placehold.co/400x300/FF6347/FFFFFF?text=Magic+Sword', title: 'Magic Sword', description: 'A powerful weapon for your quests!' },
        { image: 'https://placehold.co/400x300/9370DB/FFFFFF?text=Mystery+Potion', title: 'Mystery Potion', description: 'Restores health and magical energy!' },
        { image: 'https://placehold.co/400x300/32CD32/000000?text=Enchanted+Shield', title: 'Enchanted Shield', description: 'Protection against dark magic!' }
    ];
    
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    rewardImage.src = randomReward.image;
    document.getElementById('reward-title').textContent = randomReward.title;
    document.getElementById('reward-description').textContent = randomReward.description;
    
    // Add visual feedback
    rewardDisplay.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
    
    // Show reward display with animation
    rewardDisplay.style.transform = 'translate(-50%, -50%) scale(1)';
    rewardDisplay.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s';
    
    // Add confetti effect
    addConfettiEffect();
}

function addConfettiEffect() {
    const container = document.getElementById('ui-container');
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.borderRadius = '50%';
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.opacity = '0';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '1001';
        
        container.appendChild(confetti);
        
        // Animate confetti
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        // Trigger animation
        setTimeout(() => {
            confetti.style.transition = 'all 1s ease-out';
            confetti.style.opacity = '1';
            confetti.style.transform = `translate(${x}px, ${y}px)`;
        }, 10);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.style.opacity = '0';
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 1000);
        }, 1000);
    }
}

function setupUIControls() {
    const closeButton = document.getElementById('close-reward');
    closeButton.addEventListener('click', function() {
        const rewardDisplay = document.getElementById('reward-display');
        rewardDisplay.style.transform = 'translate(-50%, -50%) scale(0)';
        
        // Show open button again for another chest
        setTimeout(() => {
            document.getElementById('open-button').style.opacity = '1';
        }, 500);
    });
}