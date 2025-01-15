(function() {
    'use strict';

    try {
        // Easter Egg functionality
        console.log('EasterEgg functionality initialized.');

        const keySequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let keyLog = [];

        window.addEventListener('keydown', (event) => {
            keyLog.push(event.key);
            if (keyLog.length > 10) {
                keyLog.shift(); // Keep only the last 10 keys
            }

            if (keyLog.join(',') === keySequence.join(',')) {
                console.log('Easter Egg Activated!');
                // Trigger the Easter Egg event here
                // Create a black overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'black';
                overlay.style.zIndex = '10000';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';

                // Create a close button
                const closeButton = document.createElement('button');
                closeButton.innerHTML = 'Close';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '10px';
                closeButton.style.right = '10px';
                closeButton.style.zIndex = '10001';
                closeButton.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                });

                // Append the close button to the overlay
                overlay.appendChild(closeButton);

                // Create a canvas for the game
                const canvas = document.createElement('canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                overlay.appendChild(canvas);

                // Append the overlay to the body
                document.body.appendChild(overlay);

                // Initialize Phaser game
                const config = {
                    type: Phaser.AUTO,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    parent: overlay,
                    scene: {
                        preload: preload,
                        create: create,
                        update: update
                    }
                };

                const game = new Phaser.Game(config);

                function preload() {
                    // No assets to load, using font characters
                }

                function create() {
                    this.ship = {
                        x: config.width / 2,
                        y: config.height / 2,
                        angle: 0,
                        speed: 0,
                        rotation: 0
                    };

                    this.cursors = this.input.keyboard.addKeys({
                        up: Phaser.Input.Keyboard.KeyCodes.UP,
                        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                        space: Phaser.Input.Keyboard.KeyCodes.SPACE
                    });

                    this.asteroids = [];
                    for (let i = 0; i < 5; i++) {
                        this.asteroids.push({
                            x: Math.random() * config.width,
                            y: Math.random() * config.height,
                            char: ['O', 'Q', 'G'][Math.floor(Math.random() * 3)],
                            speed: 1 + Math.random() * 2,
                            angle: Math.random() * Math.PI * 2
                        });
                    }

                    this.bullets = [];
                    this.score = 0;
                }

                function update() {
                    // Shoot bullets
                    if (this.cursors.space.isDown) {
                        this.bullets.push({
                            x: this.ship.x,
                            y: this.ship.y,
                            angle: this.ship.angle,
                            speed: 5
                        });
                    }

                    if (this.cursors.left.isDown) this.ship.rotation = -0.1;
                    if (this.cursors.right.isDown) this.ship.rotation = 0.1;
                    if (this.cursors.up.isDown) this.ship.speed = 2;
                    this.ship.angle += this.ship.rotation;
                    this.ship.x += Math.cos(this.ship.angle) * this.ship.speed;
                    this.ship.y += Math.sin(this.ship.angle) * this.ship.speed;

                    // Wrap ship around edges
                    if (this.ship.x < 0) this.ship.x = config.width;
                    if (this.ship.x > config.width) this.ship.x = 0;
                    if (this.ship.y < 0) this.ship.y = config.height;
                    if (this.ship.y > config.height) this.ship.y = 0;

                    // Update asteroids
                    this.asteroids.forEach((asteroid, index) => {
                        asteroid.x += Math.cos(asteroid.angle) * asteroid.speed;
                        asteroid.y += Math.sin(asteroid.angle) * asteroid.speed;

                        // Remove asteroids that fly off-screen
                        if (asteroid.x < 0 || asteroid.x > config.width || asteroid.y < 0 || asteroid.y > config.height) {
                            this.asteroids.splice(index, 1);
                        }
                    });

                    // Update bullets
                    this.bullets.forEach((bullet, index) => {
                        bullet.x += Math.cos(bullet.angle) * bullet.speed;
                        bullet.y += Math.sin(bullet.angle) * bullet.speed;

                        // Remove bullets that fly off-screen
                        if (bullet.x < 0 || bullet.x > config.width || bullet.y < 0 || bullet.y > config.height) {
                            this.bullets.splice(index, 1);
                        }
                    });

                    // Check for collisions
                    this.bullets.forEach((bullet, bulletIndex) => {
                        this.asteroids.forEach((asteroid, asteroidIndex) => {
                            const dx = bullet.x - asteroid.x;
                            const dy = bullet.y - asteroid.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance < 20) { // Collision detected
                                this.asteroids.splice(asteroidIndex, 1);
                                this.bullets.splice(bulletIndex, 1);
                                this.score += 10;
                            }
                        });
                    });

                    // Clear canvas
                    this.cameras.main.setBackgroundColor('#000000');

                    // Draw ship
                    this.add.text(this.ship.x, this.ship.y, 'A', { font: '32px Arial', fill: '#ffffff' }).setOrigin(0.5);

                    // Draw asteroids
                    this.asteroids.forEach(asteroid => {
                        this.add.text(asteroid.x, asteroid.y, asteroid.char, { font: '32px Arial', fill: '#ffffff' }).setOrigin(0.5);
                    });

                    // Draw bullets
                    this.bullets.forEach(bullet => {
                        this.add.text(bullet.x, bullet.y, '.', { font: '32px Arial', fill: '#ffffff' }).setOrigin(0.5);
                    });

                    // Display score
                    this.add.text(10, 10, `Score: ${this.score}`, { font: '20px Arial', fill: '#ffffff' });
                }

                keyLog = []; // Reset the log after activation
            }
        });
    } catch (error) {
        console.error('An error occurred in EasterEgg:', error);
    }
})();
