import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- Colors ---
const ACTIVE_COLOR = "#38bdf8";
const INACTIVE_COLOR = "#94a3b8";
const ACCENT_COLOR_1 = "#f472b6";
const ACCENT_COLOR_2 = "#fbbf24";

// --- Generic Wrapper ---
function NavIcon3D({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-[28px] h-[28px] relative">
            <Canvas
                gl={{ alpha: true, antialias: true }}
                camera={{ position: [0, 0, 4.5], fov: 45 }}
                style={{ pointerEvents: 'none' }}
            >
                <ambientLight intensity={1.2} />
                <pointLight position={[5, 5, 5]} intensity={1.5} />
                <pointLight position={[-5, -5, -5]} intensity={0.5} />
                {children}
            </Canvas>
        </div>
    );
}

// 1. Markets: Bouncing Bars (Standard Mesh)
export function MarketsIcon({ active = false }: { active?: boolean }) {
    const group = useRef<THREE.Group>(null);
    const bar1 = useRef<THREE.Mesh>(null);
    const bar2 = useRef<THREE.Mesh>(null);
    const bar3 = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!group.current) return;
        group.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;

        if (active) {
            if (bar1.current) bar1.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
            if (bar2.current) bar2.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 8 + 1) * 0.3;
            if (bar3.current) bar3.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 8 + 2) * 0.3;
        } else {
            if (bar1.current) bar1.current.scale.y = 1;
            if (bar2.current) bar2.current.scale.y = 1;
            if (bar3.current) bar3.current.scale.y = 1;
        }
    });

    return (
        <group ref={group}>
            <mesh ref={bar1} position={[-0.5, 0, 0]}>
                <boxGeometry args={[0.3, 0.8, 0.3]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
            <mesh ref={bar2} position={[0, 0.2, 0]}>
                <boxGeometry args={[0.3, 1.2, 0.3]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
            <mesh ref={bar3} position={[0.5, -0.1, 0]}>
                <boxGeometry args={[0.3, 0.6, 0.3]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
        </group>
    );
}

// 2. Dashboards: Floating Donut (Standard Mesh)
export function DashboardIcon({ active = false }: { active?: boolean }) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        mesh.current.rotation.x += delta * (active ? 0.5 : 0.2);
        mesh.current.rotation.y += delta * (active ? 2 : 0.5);

        if (active) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
            mesh.current.scale.set(scale, scale, scale);
        } else {
            mesh.current.scale.set(1, 1, 1);
        }
    });

    return (
        <mesh ref={mesh}>
            <torusGeometry args={[0.7, 0.35, 16, 32]} />
            <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
        </mesh>
    );
}

// 3. Activity: Pulsating Geometry
export function ActivityIcon({ active = false }: { active?: boolean }) {
    const group = useRef<THREE.Group>(null);
    const orbitSphere = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (!group.current) return;
        group.current.rotation.z += delta * (active ? 1 : 0.2);

        if (orbitSphere.current) {
            const time = state.clock.elapsedTime;
            orbitSphere.current.position.x = Math.cos(time * 3) * 0.8;
            orbitSphere.current.position.y = Math.sin(time * 3) * 0.8;
        }
    });

    return (
        <group ref={group}>
            {/* Center Core */}
            <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
            {/* Orbiting Particle */}
            <mesh ref={orbitSphere} position={[0.8, 0, 0]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color={active ? ACCENT_COLOR_1 : INACTIVE_COLOR} />
            </mesh>
        </group>
    );
}

// 4. Ranks: Spinning Star
export function RanksIcon({ active = false }: { active?: boolean }) {
    const group = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!group.current) return;
        group.current.rotation.y += delta * (active ? 2.5 : 0.5);
        group.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    });

    return (
        <group ref={group}>
            <mesh>
                <icosahedronGeometry args={[0.7, 0]} />
                <meshStandardMaterial color={active ? ACCENT_COLOR_2 : INACTIVE_COLOR} />
            </mesh>
            {active && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.0, 0.05, 8, 32]} />
                    <meshStandardMaterial color={ACTIVE_COLOR} />
                </mesh>
            )}
        </group>
    );
}

// 5. Rewards: Wiggling Gift Box (Standard Mesh)
export function RewardsIcon({ active = false }: { active?: boolean }) {
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!group.current) return;

        if (active) {
            group.current.rotation.z = Math.sin(state.clock.elapsedTime * 15) * 0.1;
            group.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 5)) * 0.1;
        } else {
            group.current.rotation.z = 0;
            group.current.position.y = 0;
        }
    });

    // Simulating box with standard geometry
    return (
        <group ref={group}>
            {/* Box Body */}
            <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[1, 0.9, 1]} />
                <meshStandardMaterial color={active ? ACCENT_COLOR_1 : INACTIVE_COLOR} />
            </mesh>
            {/* Lid */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.1, 0.25, 1.1]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
            {/* Bow (Sphere) */}
            <mesh position={[0, 0.65, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
            </mesh>
        </group>
    );
}

// Wrapper to export mapped by name
export const NavIcons = {
    Markets: (props: any) => <NavIcon3D><MarketsIcon {...props} /></NavIcon3D>,
    Dashboards: (props: any) => <NavIcon3D><DashboardIcon {...props} /></NavIcon3D>,
    Activity: (props: any) => <NavIcon3D><ActivityIcon {...props} /></NavIcon3D>,
    Ranks: (props: any) => <NavIcon3D><RanksIcon {...props} /></NavIcon3D>,
    Rewards: (props: any) => <NavIcon3D><RewardsIcon {...props} /></NavIcon3D>,
};
