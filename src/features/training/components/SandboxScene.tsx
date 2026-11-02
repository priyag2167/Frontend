import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function SandboxScene({
  onSelect,
}: {
  onSelect: (part: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    callback = useRef(onSelect);
  const [selected, setSelected] = useState("Select a component"),
    [error, setError] = useState("");
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      queueMicrotask(() =>
        setError(
          "3D rendering is unavailable on this device. Ask your training manager for an alternative course.",
        ),
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor("#edf5f1");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(5, 3.8, 5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.1, 0);
    controls.maxDistance = 12;
    controls.minDistance = 3;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x78988b, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 7, 4);
    scene.add(light);
    const material = new THREE.MeshStandardMaterial({
        color: 0x769e91,
        roughness: 0.4,
        metalness: 0.5,
      }),
      accent = new THREE.MeshStandardMaterial({
        color: 0x148b73,
        metalness: 0.35,
        roughness: 0.35,
      });
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.35, 1.8),
      material,
    );
    base.position.y = 0.2;
    scene.add(base);
    const press = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 1.2, 48),
      accent,
    );
    press.position.y = 1;
    press.name = "Press";
    scene.add(press);
    const hopper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.25, 0.9, 48),
      material,
    );
    hopper.position.set(0, 2.1, 0);
    hopper.name = "Hopper";
    scene.add(hopper);
    const outlet = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.22, 0.5),
      material,
    );
    outlet.position.set(1.05, 0.7, 0);
    outlet.rotation.z = -0.18;
    outlet.name = "Outlet";
    scene.add(outlet);
    const floor = new THREE.GridHelper(8, 16, 0xc0d4ca, 0xdce8e1);
    scene.add(floor);
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const parts = [press, hopper, outlet];
    function select(part: string) {
      setSelected(`${part} explored — simulated component only`);
      callback.current(part);
      parts.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
      });
      const mesh = parts.find((p) => p.name === part);
      if (mesh)
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x123e2d);
    }
    function pick(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(parts)[0];
      if (hit) select(hit.object.name);
    }
    renderer.domElement.addEventListener("click", pick);
    const observer = new ResizeObserver(() => {
      const width = element.clientWidth;
      renderer.setSize(width, 320);
      camera.aspect = width / 320;
      camera.updateProjectionMatrix();
    });
    observer.observe(element);
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
    const choose = (event: Event) =>
      select((event as CustomEvent<string>).detail);
    element.addEventListener("choose-component", choose);
    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      renderer.domElement.removeEventListener("click", pick);
      element.removeEventListener("choose-component", choose);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
        }
      });
      material.dispose();
      accent.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="sandbox-scene">
      <div
        ref={host}
        role="img"
        aria-label="Interactive 3D training model with hopper, press and outlet"
      />
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="segmented">
            {["Hopper", "Press", "Outlet"].map((part) => (
              <button
                type="button"
                key={part}
                onClick={() =>
                  host.current?.dispatchEvent(
                    new CustomEvent("choose-component", { detail: part }),
                  )
                }
              >
                {part}
              </button>
            ))}
          </div>
          <p role="status">{selected}</p>
        </>
      )}
    </div>
  );
}
