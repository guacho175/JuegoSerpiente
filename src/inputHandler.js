// src/inputHandler.js
// Módulo de manejo de entrada híbrida (teclado + gestos táctiles)
// Exporta funciones para suscribirse a eventos de movimiento, rotación y aceleración.

class InputHandler {
  constructor() {
    this.moveCallbacks = [];
    this.rotateCallbacks = [];
    this.accelerateCallbacks = [];
    this.isTouchDevice = navigator.maxTouchPoints > 0;
    this._init();
  }

  // Registro de callbacks
  onMove(cb) { this.moveCallbacks.push(cb); }
  onRotate(cb) { this.rotateCallbacks.push(cb); }
  onAccelerate(cb) { this.accelerateCallbacks.push(cb); }

  // Disparar callbacks
  _emitMove(dir) { this.moveCallbacks.forEach(cb => cb(dir)); }
  _emitRotate() { this.rotateCallbacks.forEach(cb => cb()); }
  _emitAccelerate() { this.accelerateCallbacks.forEach(cb => cb()); }

  // Inicializar listeners
  _init() {
    // Teclado (desktop)
    window.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
      if (keys.includes(e.key)) e.preventDefault();
      switch (e.key) {
        case 'ArrowLeft': this._emitMove({ x: -1, y: 0 }); break;
        case 'ArrowRight': this._emitMove({ x: 1, y: 0 }); break;
        case 'ArrowDown': this._emitAccelerate(); break; // caída rápida / acelerar
        case 'ArrowUp': this._emitRotate(); break;
        case ' ': this._emitAccelerate(); break; // espacio como aceleración opcional
        default: break;
      }
    });

    // Táctil (mobile)
    if (this.isTouchDevice) {
      let startX = 0, startY = 0;
      const threshold = 30; // px para considerar swipe
      const onTouchStart = (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
      };
      const onTouchEnd = (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
          // Tap simple → aceleración (puede usarse para rotar en Tetris)
          this._emitAccelerate();
          return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
          // Swipe horizontal
          if (dx > 0) this._emitMove({ x: 1, y: 0 });
          else this._emitMove({ x: -1, y: 0 });
        } else {
          // Swipe vertical
          if (dy > 0) this._emitAccelerate(); // swipe down
          else this._emitRotate(); // swipe up
        }
      };
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
    }
  }
}

// Exportar una única instancia para que sea fácil de usar en ambos juegos
export const inputHandler = new InputHandler();
