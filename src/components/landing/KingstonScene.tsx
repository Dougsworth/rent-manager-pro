import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Hope Pastures Flats: a three storey Kingston apartment block in Three.js.
 * Each flat has a bank of green jalousie louvres. Paid up flats stand open with
 * a warm room behind, flats due soon are half open, late flats are shut.
 *
 * Built for a fast landing page: rendered only while visible and only while
 * something moves, pixel ratio capped, quality drops on slow devices, and the
 * page shows a poster until the first frame lands.
 */

export type FlatState = 'paid' | 'due' | 'late';

/** Slat angle in radians. Shut slats keep a slight tilt so they overlap like shingles. */
const OPEN: Record<FlatState, number> = { paid: 1.2, due: 0.62, late: 0.14 };

const W = 12; // width
const D = 7; // depth
const FH = 3; // floor height
const FLOORS = 3;
const H = FH * FLOORS;
const PARAPET = 0.6;
const WALL = 0.3; // front wall thickness

interface Flat {
  id: number;
  slats: THREE.Object3D[];
  room: THREE.MeshStandardMaterial;
  cur: number;
  target: number;
}

interface KingstonSceneProps {
  flats: Record<number, FlatState>;
  onReady?: () => void;
  className?: string;
}

function breezeBlockTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#000';
  // One block: a round opening split by a slim cross, the classic Caribbean ventilation block
  g.beginPath();
  g.arc(64, 64, 44, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.fillRect(58, 16, 12, 96);
  g.fillRect(16, 58, 96, 12);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export default function KingstonScene({ flats, onReady, className }: KingstonSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(flats);
  latest.current = flats;
  const setFlatsRef = useRef<(f: Record<number, FlatState>) => void>(() => {});
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; // No WebGL: the poster stays.
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const small = el.clientWidth < 640;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.3;

    const camera = new THREE.PerspectiveCamera(24, 1, 0.5, 200);

    // Morning light from the upper left, sky above, the green field bouncing back below
    scene.add(new THREE.HemisphereLight(0xdfe9ee, 0x1a4a3c, 0.9));
    const sun = new THREE.DirectionalLight(0xffeccc, 2.8);
    sun.position.set(-10, 17, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 16, bottom: -8, near: 1, far: 60 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 4;
    scene.add(sun);

    const mat = (color: number, roughness = 0.9, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.12 });
    const paint = mat(0xe4e0d6);
    const trim = mat(0xd4cfc3, 0.85);
    const frame = mat(0xf8f7f2, 0.6);
    const slatMat = mat(0x1f5a48, 0.5, 0.05);
    const dark = mat(0x26302b, 1);
    const tank = mat(0x151716, 0.45);
    const glass = mat(0x24313a, 0.25, 0.4);
    const pave = mat(0xbfc4bb, 0.95);

    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      return mesh;
    };

    const building = new THREE.Group();
    scene.add(building);

    // Body, roof parapets
    building.add(box(W, H, D, paint, 0, H / 2, 0));
    building.add(box(0.2, PARAPET, D, paint, -W / 2 + 0.1, H + PARAPET / 2, 0));
    building.add(box(0.2, PARAPET, D, paint, W / 2 - 0.1, H + PARAPET / 2, 0));
    building.add(box(W, PARAPET, 0.2, paint, 0, H + PARAPET / 2, -D / 2 + 0.1));

    // Front wall with openings for six flats and the stair core
    const win = { w: 3.2, h: 1.9 };
    const colX = [-3.35, 3.35];
    const openings: { x: number; y: number; w: number; h: number; flat?: number }[] = [];
    for (let f = 0; f < FLOORS; f++) {
      colX.forEach((x, c) => openings.push({ x, y: f * FH + 1.7, w: win.w, h: win.h, flat: f * 2 + c + 1 }));
    }
    const core = { x: 0, y: (0.7 + H - 0.4) / 2, w: 2.2, h: H - 0.4 - 0.7 };
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo(W / 2, 0);
    shape.lineTo(W / 2, H + PARAPET);
    shape.lineTo(-W / 2, H + PARAPET);
    shape.closePath();
    for (const o of [...openings, core]) {
      const p = new THREE.Path();
      p.moveTo(o.x - o.w / 2, o.y - o.h / 2);
      p.lineTo(o.x - o.w / 2, o.y + o.h / 2);
      p.lineTo(o.x + o.w / 2, o.y + o.h / 2);
      p.lineTo(o.x + o.w / 2, o.y - o.h / 2);
      p.closePath();
      shape.holes.push(p);
    }
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false }), paint);
    front.position.z = D / 2;
    front.castShadow = true;
    front.receiveShadow = true;
    building.add(front);

    const fz = D / 2 + WALL; // outer face of the front wall
    // Floor slabs read as bands across the facade, a cornice on top
    for (let f = 1; f < FLOORS; f++) building.add(box(W + 0.12, 0.16, 0.2, trim, 0, f * FH, fz + 0.1));
    building.add(box(W + 0.16, 0.14, WALL + 0.36, trim, 0, H + PARAPET + 0.07, D / 2 + WALL / 2 + 0.02));

    // Stair core: breeze blocks over a dark stairwell
    const bb = breezeBlockTexture();
    bb.repeat.set(Math.round(core.w / 0.72), Math.round(core.h / 0.72));
    const breeze = new THREE.Mesh(
      new THREE.PlaneGeometry(core.w, core.h),
      new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.95, alphaMap: bb, alphaTest: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.12 }),
    );
    breeze.position.set(core.x, core.y, fz - 0.08);
    building.add(breeze);
    building.add(box(core.w, core.h, 0.02, dark, core.x, core.y, D / 2 + 0.02, false));

    // A louvre bank: frame, stiles, and slats that each turn on their own pivot
    const louvre = (w: number, h: number, slatsOut: THREE.Object3D[]) => {
      const g = new THREE.Group();
      const n = Math.round(h / 0.19);
      const step = h / n;
      const geo = new THREE.BoxGeometry(w - 0.14, step * 1.14, 0.028);
      for (let i = 0; i < n; i++) {
        const pivot = new THREE.Group();
        pivot.position.y = -h / 2 + step * (i + 0.5);
        const s = new THREE.Mesh(geo, slatMat);
        s.castShadow = true;
        s.receiveShadow = true;
        pivot.add(s);
        g.add(pivot);
        slatsOut.push(pivot);
      }
      g.add(box(0.07, h, 0.1, frame, -w / 2 + 0.035, 0, 0));
      g.add(box(0.07, h, 0.1, frame, w / 2 - 0.035, 0, 0));
      g.add(box(0.06, h, 0.08, frame, 0, 0, 0));
      return g;
    };

    const flatList: Flat[] = [];
    for (const o of openings) {
      const room = new THREE.MeshStandardMaterial({ color: 0x2b3530, roughness: 1, emissive: new THREE.Color(0xffc98a), emissiveIntensity: 0 });
      const back = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), room);
      back.position.set(o.x, o.y, D / 2 + 0.01);
      back.receiveShadow = true;
      building.add(back);
      const slats: THREE.Object3D[] = [];
      const l = louvre(o.w, o.h, slats);
      l.position.set(o.x, o.y, D / 2 + WALL * 0.55);
      building.add(l);
      building.add(box(o.w + 0.3, 0.09, 0.34, trim, o.x, o.y - o.h / 2 - 0.045, fz + 0.1));
      slats.forEach((p) => (p.rotation.x = OPEN.late));
      flatList.push({ id: o.flat!, slats, room, cur: OPEN.late, target: OPEN.late });
    }

    // Side windows, half open, so the block reads as lived in from the corner
    for (let f = 0; f < FLOORS; f++) {
      for (const z of [-1.6, 1.6]) {
        const s: THREE.Object3D[] = [];
        const l = louvre(1.4, 1.3, s);
        s.forEach((p) => (p.rotation.x = 0.7));
        l.rotation.y = Math.PI / 2;
        l.position.set(W / 2 + 0.06, f * FH + 1.75, z);
        building.add(box(0.02, 1.3, 1.4, dark, W / 2 + 0.011, f * FH + 1.75, z, false));
        building.add(l);
      }
    }

    // On the roof: two black water tanks, a solar water heater, the stair head
    const cyl = (r: number, h: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      return mesh;
    };
    building.add(cyl(0.62, 1.25, tank, 3.9, H + 0.62, -1.6));
    building.add(cyl(0.26, 0.12, tank, 3.9, H + 1.3, -1.6));
    building.add(cyl(0.55, 1.1, tank, 2.4, H + 0.55, -2.2));
    building.add(cyl(0.22, 0.12, tank, 2.4, H + 1.16, -2.2));
    const panel = box(2.0, 0.06, 1.2, glass, -3.6, H + 0.7, -1.3);
    panel.rotation.x = -0.5;
    building.add(panel);
    const heater = cyl(0.22, 2.0, frame, -3.6, H + 1.12, -1.95);
    heater.rotation.z = Math.PI / 2;
    building.add(heater);
    building.add(box(2.6, 2.3, 2.4, paint, 0, H + 1.15, 1.2));
    building.add(box(2.8, 0.12, 2.6, trim, 0, H + 2.36, 1.2));

    // Ground: paved apron, two low hedges, and a shadow catcher that lets the green show through
    building.add(box(W + 4, 0.24, D + 5.5, pave, 0, -0.12, 0.9, false));
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.32 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = -0.24;
    catcher.receiveShadow = true;
    scene.add(catcher);

    // Camera: a three quarter view from the right, framed to the container
    const target = new THREE.Vector3(0.4, 4.9, 0.6);
    const baseAz = 0.52;
    const el0 = 0.2;
    let az = baseAz;
    let azTarget = baseAz;
    const frameCamera = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const r = Math.max(8.2 / t, 9.6 / (t * camera.aspect)) * 1.04;
      camera.position.set(
        target.x + r * Math.sin(az) * Math.cos(el0),
        target.y + r * Math.sin(el0),
        target.z + r * Math.cos(az) * Math.cos(el0),
      );
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    frameCamera();

    // Render loop: only while visible, only while something is moving
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let ready = false;
    let frames = 0;
    let slowTime = 0;
    let degraded = false;

    const tick = (t: number) => {
      raf = 0;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      let moving = false;

      for (const fl of flatList) {
        const diff = fl.target - fl.cur;
        if (Math.abs(diff) > 0.0005) {
          fl.cur += diff * (1 - Math.exp(-dt * 5.5));
          moving = true;
        } else fl.cur = fl.target;
        fl.slats.forEach((s) => (s.rotation.x = fl.cur));
        fl.room.emissiveIntensity = Math.max(0, (fl.cur - 0.3) / 0.9) * 0.95;
      }
      const ad = azTarget - az;
      if (Math.abs(ad) > 0.0002) {
        az += ad * (1 - Math.exp(-dt * 4));
        frameCamera();
        moving = true;
      }

      renderer.render(scene, camera);

      if (!ready) {
        ready = true;
        readyRef.current?.();
      }
      // Drop to plain pixel density if the first frames are slow
      if (!degraded && frames < 40) {
        frames++;
        if (frames > 4) slowTime += dt;
        if (frames === 40 && slowTime / 36 > 0.03) {
          degraded = true;
          renderer.setPixelRatio(1);
          frameCamera();
        }
      }
      if (moving && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const apply = (f: Record<number, FlatState>, instant = false) => {
      for (const fl of flatList) {
        fl.target = OPEN[f[fl.id] ?? 'paid'];
        if (instant) fl.cur = fl.target;
      }
      kick();
    };
    setFlatsRef.current = (f) => apply(f);

    // Entrance: the block starts shut and paid flats open one after another
    const timers: number[] = [];
    if (reduce) apply(latest.current, true);
    else {
      kick();
      flatList.forEach((fl, i) => {
        timers.push(window.setTimeout(() => {
          fl.target = OPEN[latest.current[fl.id] ?? 'paid'];
          kick();
        }, 500 + i * 140));
      });
    }

    const onPointer = (e: PointerEvent) => {
      if (reduce || e.pointerType !== 'mouse') return;
      const x = e.clientX / window.innerWidth - 0.5;
      azTarget = baseAz + x * 0.12;
      kick();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      frameCamera();
      kick();
    });
    ro.observe(el);

    return () => {
      timers.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      io.disconnect();
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mm) => mm.dispose());
      });
      bb.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // the entrance sequence applies the first state
      return;
    }
    setFlatsRef.current(flats);
  }, [flats]);

  return <div ref={host} className={className} aria-hidden="true" />;
}
