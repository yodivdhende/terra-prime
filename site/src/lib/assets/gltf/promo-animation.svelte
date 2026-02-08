<script lang="ts">
	import {
		AnimationAction,
		Color,
		Group,
		LoopOnce,
		Material,
		Mesh,
		MeshBasicMaterial,
		MeshStandardMaterial,
		MirroredRepeatWrapping,
		TextureLoader,
		Vector2
	} from 'three';
	import { T, useTask } from '@threlte/core';
	import { interactivity, useCursor, useGltf, useGltfAnimations } from '@threlte/extras';
	import SiteAnimation from '$lib/assets/gltf/site-animation.glb';
	import WorldReverseImage from '$lib/assets/images/WorldReverseGreen.png';
	import FloorTexture from '$lib/assets/images/Grid.png';
	import { Tween } from 'svelte/motion';
	import { getPromoAnimationManagerContext } from '$lib/managers/promo-animation-manager.svelte';

	let { onWorldClick, ...props }: { onWorldClick: () => void } = $props();
	const ref = new Group();
	const gltf = useGltf<{
		nodes: Record<string, Mesh>;
		materials: Record<string, Material>;
	}>(SiteAnimation as string);
	export const { actions, mixer } = useGltfAnimations(gltf, ref);

	interactivity();

	const { onPointerEnter, onPointerLeave } = useCursor();
	const sphereProps = {
		Sphere01: createSphere()
	} as const;
	const cameraZoom = new Tween(200);
	const wireframeMaterial = createWorldTexture();
	const floorMaterial = createFloorMaterial();
	const torusMaterial = new MeshStandardMaterial({
		color: new Color().setRGB(0, 1, 0),
		emissive: new Color().setRGB(0, 1, 0),
		emissiveIntensity: 1,
		normalScale: new Vector2(1, -1),
		side: 2
	});
	let sphereRotation = $state(0);
	let promoAnimationManager = getPromoAnimationManagerContext();
	promoAnimationManager.registerAnimation({ animation: rowAnimation });
	promoAnimationManager.registerAnimation({ animation: constalationAnimation });
	let sphereScale = $derived.by(() => {
		if (window.innerWidth < 500) return window.innerWidth / 500;
		return 1;
	});

	function createSphere() {
		let numberOfClicks = 0;
		return {
			onHover: () => onPointerEnter(),
			onHoverLeave: () => onPointerLeave(),
			onClick: () => {
				numberOfClicks++;
				if (numberOfClicks === 7) onWorldClick();
				if (numberOfClicks === 1) setTimeout(() => (numberOfClicks = 0), 1000);
			}
		};
	}

	export function constalationAnimation(reverse = false) {
		animateOnce($actions['CameraAction'], { reverse });
		cameraZoom.set(reverse ? 200 : 80);
		Object.entries($actions)
			.filter(([name, _action]) => name.includes('Move'))
			.forEach(([_, action]) => animateOnce(action, { reverse }));
	}

	export function rowAnimation(reverse = false) {
		cameraZoom.set(reverse ? 200 : 80);
		Object.entries($actions)
			.filter(([name, _action]) => name.includes('Action') && !name.includes('Camera'))
			.forEach(([_, action]) => animateOnce(action, { reverse }));
	}

	function animateOnce(
		action: AnimationAction | undefined,
		{ reverse }: { reverse?: boolean } = {}
	) {
		if (!action) return;
		action.paused = false;
		action.clampWhenFinished = true;
		if (reverse) {
			action.timeScale = action.timeScale * -1;
		} else {
			action.timeScale = Math.abs(action.timeScale);
		}
		action.setLoop(LoopOnce, 1);
		action.play();
	}

	function createWorldTexture() {
		const material = new MeshStandardMaterial();
		const worldTexture = new TextureLoader().load(WorldReverseImage);
		worldTexture.flipY = false;
		material.color = new Color().setRGB(0, 0, 0);
		material.emissiveMap = worldTexture;
		material.emissive = new Color().setRGB(255, 255, 255);
		material.emissiveIntensity = 0.01;
		return material;
	}

	useTask((delta) => {
		sphereRotation += delta * 0.5;
		if (sphereRotation > Math.PI * 2) {
			sphereRotation = 0;
		}
	});

	function createFloorMaterial() {
		const material = new MeshBasicMaterial();
		const planeTexture = new TextureLoader().load(FloorTexture);
		const vectorValue = 7;
		planeTexture.repeat = new Vector2(vectorValue, vectorValue);
		planeTexture.wrapS = planeTexture.wrapT = MirroredRepeatWrapping;
		material.map = planeTexture;
		material.opacity = 0.2;
		material.transparent = true;
		return material;
	}
</script>

<T is={ref} dispose={false} {...props}>
	{#await gltf}
		<p>Loading...</p>
	{:then gltf}
		<T.Group name="Scene">
			<T.OrthographicCamera
				name="Camera01"
				makeDefault={true}
				zoom={cameraZoom.current}
				far={100}
				near={0.1}
				position={[7.07, 1, 7.06]}
				rotation={[0, Math.PI / 4, 0]}
			/>
			<T.DirectionalLight
				name="Sun"
				intensity={1}
				decay={2}
				position={[0, 21.62, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
			/>
			<T.Mesh
				name="Plane"
				geometry={gltf.nodes.Plane.geometry}
				material={floorMaterial}
				scale={58.28}
			/>
			<T.Mesh
				name="Sphere01"
				geometry={gltf.nodes.Sphere01.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
				onpointerenter={sphereProps.Sphere01.onHover}
				onpointerleave={sphereProps.Sphere01.onHoverLeave}
				onclick={sphereProps.Sphere01.onClick}
			/>
			<T.Mesh
				name="Sphere02"
				geometry={gltf.nodes.Sphere02.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere03"
				geometry={gltf.nodes.Sphere03.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere04"
				geometry={gltf.nodes.Sphere04.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere05"
				geometry={gltf.nodes.Sphere05.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere06"
				geometry={gltf.nodes.Sphere06.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere07"
				geometry={gltf.nodes.Sphere07.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Torus01"
				geometry={gltf.nodes.Torus01.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus02"
				geometry={gltf.nodes.Torus02.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus03"
				geometry={gltf.nodes.Torus03.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus04"
				geometry={gltf.nodes.Torus04.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus05"
				geometry={gltf.nodes.Torus05.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus06"
				geometry={gltf.nodes.Torus06.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Torus07"
				geometry={gltf.nodes.Torus07.geometry}
				material={torusMaterial}
				position={[0, 0.01, 0]}
				scale={0.96}
			/>
			<T.Mesh
				name="Sphere08"
				geometry={gltf.nodes.Sphere08.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere09"
				geometry={gltf.nodes.Sphere09.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere10"
				geometry={gltf.nodes.Sphere10.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere11"
				geometry={gltf.nodes.Sphere11.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere12"
				geometry={gltf.nodes.Sphere12.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
			<T.Mesh
				name="Sphere13"
				geometry={gltf.nodes.Sphere13.geometry}
				material={wireframeMaterial}
				position={[0, 1, 0]}
				rotation.y={sphereRotation}
				scale={[sphereScale, sphereScale, sphereScale]}
			/>
		</T.Group>
	{:catch err}
		<p>Error loading model: {err.message}</p>
	{/await}
</T>
