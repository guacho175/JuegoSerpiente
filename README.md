# Ritmo Neon Serpiente

Juego en vivo: https://ritmo-ne-n-serpiente-727131753810.us-west1.run.app/

## Descripcion

Ritmo Neon Serpiente es una version moderna del clasico Snake con estetica neon, ranking global y soporte completo para escritorio y moviles.

## Estandar aplicado

Este proyecto es la referencia base para la estandarizacion de la franquicia.

- UI responsiva con header, ranking lateral, area central de juego y reproductor musical.
- Tokens visuales compartidos: Space Grotesk, JetBrains Mono, cian/magenta/lima.
- Gameplay sobre canvas con entradas hibridas (teclado y tactil).

## Arquitectura comun

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + motion/react
- Render de juego con canvas y requestAnimationFrame
- Ranking remoto (Apps Script) con fallback localStorage
- Dockerfile multistage + cloudbuild.yaml para Cloud Run

## Controles

- Escritorio: flechas o WASD para mover, P o espacio para pausar.
- Movil: swipe y D-pad tactil.

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar entorno local:

```bash
npm run dev
```

3. Validar tipado:

```bash
npm run lint
```

## Build y despliegue

- Build: npm run build
- Imagen: Dockerfile (multi-stage)
- Runtime: puerto 8080 compatible con Google Cloud Run

## Creditos

Desarrollado por Galindez & IA.
