// Game loop using requestAnimationFrame with fixed timestep for physics

export class GameLoop {
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulatedTime: number = 0;
  private readonly fixedTimestep: number = 1 / 60; // 60Hz physics
  private isRunning: boolean = false;
  
  constructor(
    private update: (deltaTime: number) => void,
    private render: () => void
  ) {}
  
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private loop = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    // Accumulate time for fixed timestep physics
    this.accumulatedTime += deltaTime;
    
    // Run physics updates at fixed timestep
    while (this.accumulatedTime >= this.fixedTimestep) {
      this.update(this.fixedTimestep);
      this.accumulatedTime -= this.fixedTimestep;
    }
    
    // Render at variable timestep (matches display refresh rate)
    this.render();
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

