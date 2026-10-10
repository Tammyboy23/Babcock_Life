# Babcock Life: Project and Three.js Build Guide

Babcock Life is a browser-based university life simulator set on a fictional Nigerian campus. It is
built with React and TypeScript for the interface and game rules, Zustand for shared game state,
Vite for local development and bundling, and Three.js for the fixed-camera 3D environments.

This guide has two goals:

1. Explain how this particular project is put together, file by file and in execution order.
2. Teach a React developer who is new to Three.js how to build a similar interactive 3D game.

The world is not a first-person walking game. It is a Sims-like, angled room/campus view. Drag the
scene to rotate the camera, tap a floor location to move the character, and use scene actions or game
menus to perform activities.

## 1. Run the Project

Install the project dependencies and start Vite:

```bash
npm install
npm run dev
```

Vite prints a local address, normally `http://localhost:5173`. The project also has these commands:

```bash
npm run build    # TypeScript project checks, then create the production bundle
npm run lint     # Run oxlint
npm run preview  # Serve a previously built production bundle
```

The important dependencies are React, React DOM, Zustand, lucide-react and Three.js. Three.js is a
regular JavaScript library, so this project uses its own Three.js renderer inside a React component;
it does not use React Three Fiber.

## 2. What the Player Does

The main game loop is:

1. Create a student and choose their appearance.
2. Receive a one-time **NEPO** or **LAPO** lifestyle assignment and starting allowance.
3. Enter the hostel and manage hunger, energy, hygiene, happiness, social life and academics.
4. Select objects, people or activities in the scene, or use the game menus.
5. Travel among eight locations, subject to opening hours and travel time.
6. Build relationships, complete missions, earn or spend in-game money, and respond to events.
7. Save automatically and continue later.

The two lifestyles are fictional game settings. NEPO starts with a larger allowance and a more
furnished room; LAPO starts with less money and a more modest room. The roll and allowance are stored
in the save so they are not rerolled on refresh.

## 3. Source Layout

### Application and interface

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | Finds the root HTML element and mounts React. |
| `src/App.tsx` | Chooses the current screen, mounts the game HUD and location, and displays panels, dialogue, events and overlays. |
| `src/components/GameHUD.tsx` | Shows identity, location, clock, money and navigation. |
| `src/components/FullScreenLocationView.tsx` | Connects the current save and game actions to the active location scene. |
| `src/components/scenes/index.tsx` | Defines each location's hotspot positions and dispatches the active scene. |
| `src/components/scenes/Environment3D.tsx` | Creates and owns the Three.js scene, camera, renderer, lighting, player movement and action animations. |
| `src/components/scenes/Avatar.tsx` | Draws the reusable illustrated avatar used in UI portraits and character creation. |
| `src/index.css` | Global CSS, Tailwind component classes, page sizing and canvas defaults. |

The scene and the interface are different layers. Three.js draws the world into a `<canvas>`. React
draws the HUD, dialogs and accessible HTML buttons on top of that canvas. This makes menus easy to
build with normal React while still using a real 3D renderer for the environment.

### Game rules and saved data

| File | Responsibility |
| --- | --- |
| `src/game/GameState.ts` | Zustand store; owns game actions, state mutations, validation, sounds, notifications and save updates. |
| `src/game/SaveSystem.ts` | Creates, loads, sanitizes and migrates the browser save. |
| `src/game/ActivitiesSystem.ts` | Activity definitions and their costs, time, needs, rewards, blockers and results. |
| `src/game/NeedsSystem.ts` | Need decay, gain multipliers, labels and warnings. |
| `src/game/EconomySystem.ts` | Shop catalog, item validation, furniture and outfit rules. |
| `src/game/RelationshipSystem.ts` and `src/game/npcs.ts` | Fictional students, conversations, relationship changes and interaction costs. |
| `src/game/MissionSystem.ts` | Mission definitions and progress derived from game statistics. |
| `src/game/EventSystem.ts` | Event selection and the effects of event choices. |
| `src/game/ScheduleSystem.ts` and `src/game/timeState.ts` | Calendar, lectures, event times, simulated clock and day phases. |
| `src/types/index.ts` | Shared TypeScript data types, including the save format and location IDs. |

## 4. How React and Three.js Work Together Here

React is declarative: a component returns a description of the interface. Three.js is imperative:
you create objects, add them to a scene, change their properties and ask a renderer to draw them.

The bridge is the `Environment3D` component:

1. React renders an empty `<div>` and stores its DOM node in a ref.
2. A React `useEffect` creates a Three.js `Scene`, camera, lights, environment meshes and renderer.
3. The renderer creates a `<canvas>` and appends it inside the referenced `<div>`.
4. Pointer handlers directly update the camera or character in Three.js.
5. A `ResizeObserver` updates the canvas and camera projection when the container changes size.
6. The effect cleanup removes event handlers, stops animation frames, disposes GPU resources and removes the canvas.

The effect is important. Do not construct a WebGL renderer in the body of a React component: React
may call the component more than once, and every render could create another canvas and GPU context.
Create imperative Three.js objects in an effect, and clean them up when the component unmounts or its
scene inputs change.

### The Three.js words used in the project

- **Scene**: a container for everything Three.js should render.
- **Mesh**: visible geometry plus a material. A box mesh combines a box shape with a surface color.
- **Geometry**: the shape, such as `BoxGeometry`, `CylinderGeometry` or `SphereGeometry`.
- **Material**: how a surface looks. `MeshStandardMaterial` responds to lights.
- **Camera**: the viewpoint used to project the 3D world onto the flat canvas.
- **Renderer**: the WebGL drawing system that paints the scene into a canvas.
- **Vector3**: a position or direction with `x`, `y` and `z` values.
- **Raycaster**: a utility that projects a screen point into the 3D world and finds what it points at.
- **Animation frame**: a browser callback scheduled with `requestAnimationFrame`, normally used for smooth motion.

Three.js uses a 3D coordinate system. In these scenes, `x` runs left and right, `y` is height, and
`z` runs front to back. The ground is near `y = 0`.

## 5. Follow One Scene from React to the Canvas

The application mounts `FullScreenLocationView` from `App.tsx`. That component reads the current
save and actions from Zustand, then passes them to `SceneForLocation`. `SceneForLocation` switches on
`save.locationId` and returns the matching location component. The location component defines its
hotspots and passes its location ID to `SceneFrame`. `SceneFrame` mounts `Environment3D` and draws
HTML hotspot buttons over it.

That flow is useful because each layer has one job:

1. `GameState.ts` decides whether a requested action is legal and applies the game result.
2. A location scene decides which objects and actions appear in that place.
3. `SceneFrame` provides the shared canvas-and-hotspot layout.
4. `Environment3D` builds and renders the actual 3D objects.

When a hotspot is clicked, React calls a handler such as `doActivity(activityId)`. The Three.js
renderer does not decide whether the player can afford an activity or whether a building is open.
Those rules stay in the game systems and Zustand store.

## 6. How the Current 3D World Is Built

The environment is procedural: it is assembled from code-created shapes rather than imported model
files. `Environment3D.tsx` has small reusable helpers such as `box`, `cylinder`, `sphere`, `line`,
`table`, `tree` and `person`. For example, `box` creates a `BoxGeometry`, creates a standard
material, positions the mesh, enables shadows and adds the mesh to a group.

Each location has a builder function, such as `buildHostel` or `buildLibrary`. A `BUILDERS` record
maps each `LocationId` to its builder. The renderer creates one `THREE.Group`, passes it to the
builder, then adds that group to the scene. Groups make it easier to treat all furniture and
characters in one location as a unit.

To add a location:

1. Add its string ID to the `LocationId` union in `src/types/index.ts`.
2. Add its game rules and travel/opening information in `src/game/locations.ts`.
3. Add a builder such as `buildGarden(group)` in `Environment3D.tsx`.
4. Add that builder to the `BUILDERS` record.
5. Add the location's React component and hotspot definitions in `src/components/scenes/index.tsx`.
6. Add the scene to the `SceneForLocation` switch.
7. Run the typecheck and verify the location at desktop and mobile sizes.

### Camera and lighting

The project uses `OrthographicCamera`, not `PerspectiveCamera`. An orthographic projection keeps
objects the same apparent size as they move farther away, which gives the scene an isometric,
dollhouse-like appearance. The camera is positioned diagonally above the scene and points toward the
room center. Its azimuth and elevation change when the player drags the canvas.

The scene uses a `HemisphereLight` for broad sky/ground illumination and a `DirectionalLight` for
shadows. The current time phase changes the background and light color/intensity. A
`ResizeObserver` updates the renderer dimensions and camera projection so the scene fits its React
container.

Indoor scenes have named walls. When the camera rotates, `updateCamera` hides walls that would block
the inside of the room. This is a simple camera-aware cutaway, not a physics or collision system.

### Tap-to-move and drag-to-rotate

The renderer listens for pointer events on its canvas. On pointer down it remembers the starting
position. If the pointer moves more than a small threshold, the gesture is treated as a camera drag;
horizontal and vertical pointer deltas update camera azimuth and elevation. If the pointer is
released without crossing that threshold, the screen point is converted to normalized device
coordinates and a `Raycaster` projects it through the camera. The ray intersects a horizontal plane
at ground height, and the resulting world point becomes the character's destination.

The player is moved with `requestAnimationFrame`. A smooth easing function interpolates from the
starting point to the target, while arms and legs swing in opposite directions. The gold ring is a
temporary destination marker. This is an intentionally small movement system: it does not route
around furniture, use a navigation mesh or implement collision avoidance.

### Character appearance and animation

The scene's `person` helper assembles a character from meshes and names the player's body parts so
the movement and activity animation code can find them later. A walking animation updates the
player's transforms over several animation frames. Activity cues similarly move arms, legs or the
torso to suggest eating, studying, socializing, sleeping or exercising.

The project also has an SVG-based `AvatarBody` used in portrait and character-creation UI. That is a
separate renderer from the Three.js person. If you want exactly the same face and clothing in both
places, pass the saved `AvatarLook` into `Environment3D` and apply its colors and style to the named
Three.js materials. For substantially more realistic characters, replace the primitive person with a
rigged GLTF character and drive its skeleton with animation clips.

## 7. A Beginner React-to-Three.js Build, Step by Step

This section describes how to build a small fixed-camera 3D room from a React background. It is a
learning path rather than a claim that every line below already exists verbatim in this project.

### Step 1: Install Three.js

```bash
npm install three
```

The `three` package includes TypeScript declarations. Import it into a `.tsx` file with:

```tsx
import * as THREE from 'three'
```

React still owns the page and interface. Three.js only owns the canvas and 3D objects inside it.

### Step 2: Create a React mount point

Start with a component that returns a container. Use a ref because Three.js needs the real DOM node.

```tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Room3D() {
	const host = useRef<HTMLDivElement>(null)

	return <div ref={host} className="room-3d" />
}
```

Give the container a real size. A zero-height container produces a zero-height canvas:

```css
.room-3d {
	width: 100%;
	height: 100%;
	min-height: 320px;
	overflow: hidden;
}

.room-3d canvas {
	display: block;
	width: 100%;
	height: 100%;
	touch-action: none;
}
```

In a full-screen game, make sure the ancestors also have a defined height. CSS `height: 100%` only
works when parent dimensions are established.

### Step 3: Create the scene, camera and renderer in an effect

Put the setup in `useEffect`. The effect runs after React puts the div in the document.

```tsx
useEffect(() => {
	const element = host.current
	if (!element) return

	const scene = new THREE.Scene()
	scene.background = new THREE.Color('#a9c9d5')

	const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100)
	camera.position.set(10, 12, 14)
	camera.lookAt(0, 1, 0)

	const renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	element.appendChild(renderer.domElement)

	// Add objects, handle resize, draw and return cleanup here.
}, [])
```

An orthographic camera is a useful starting point for a Sims-like view. A perspective camera is
better when you want a dramatic sense of distance, but its far-away objects appear smaller.

### Step 4: Add light

Standard materials need light to look three-dimensional. Add a soft fill light and a stronger
directional light:

```ts
scene.add(new THREE.HemisphereLight('#f2ebd8', '#59606a', 1.5))

const sunlight = new THREE.DirectionalLight('#fff0ce', 2)
sunlight.position.set(-7, 12, 8)
scene.add(sunlight)
```

The numeric intensities can be tuned to your renderer's tone mapping and material colors. The
important idea is to provide light before judging `MeshStandardMaterial` colors.

### Step 5: Make a mesh helper, then build the floor

Three.js objects are ordinary JavaScript objects. A helper prevents repeating geometry/material
setup for every item:

```ts
function addBox(
	parent: THREE.Group,
	position: [number, number, number],
	size: [number, number, number],
	color: string,
) {
	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(...size),
		new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
	)
	mesh.position.set(...position)
	mesh.castShadow = true
	mesh.receiveShadow = true
	parent.add(mesh)
	return mesh
}

const room = new THREE.Group()
scene.add(room)
addBox(room, [0, -0.15, 0], [16, 0.3, 12], '#a77e57')
addBox(room, [0, 2, -6], [16, 4, 0.25], '#ddd2bf')
```

The box arguments are width, height and depth. Its position is the center of the box, not its
bottom-left corner. That center-based rule applies to most Three.js geometries.

### Step 6: Add furniture from primitives

Compose basic shapes into recognizable objects. A bed could be a mattress box, bed-frame box and
pillow box. A desk can be a tabletop plus four legs. Create a `THREE.Group` for a compound object if
you want to move or rotate all its parts together.

Start with large recognizable silhouettes. Add bevels, decorative trim, books, lamps, fabric
colors and small props only after the room reads clearly from the camera angle. Too many tiny objects
can make a mobile scene slow and visually noisy.

### Step 7: Draw once and resize correctly

For a still room, render after initial setup and whenever the container resizes. A continuously
running animation loop is unnecessary until something moves.

```ts
const resize = () => {
	const width = Math.max(1, element.clientWidth)
	const height = Math.max(1, element.clientHeight)
	renderer.setSize(width, height)

	const aspect = width / height
	const viewHeight = 16
	camera.left = (-viewHeight * aspect) / 2
	camera.right = (viewHeight * aspect) / 2
	camera.top = viewHeight / 2
	camera.bottom = -viewHeight / 2
	camera.updateProjectionMatrix()
	renderer.render(scene, camera)
}

const observer = new ResizeObserver(resize)
observer.observe(element)
resize()
```

With an orthographic camera, changing `left`, `right`, `top` and `bottom` controls the visible world
area. Updating only the renderer size can stretch or crop the composition.

### Step 8: Clean up GPU resources

React Strict Mode may mount, clean up and mount effects again during development. Clean up every
listener, observer, animation frame, renderer, geometry and material you create:

```ts
return () => {
	observer.disconnect()
	cancelAnimationFrame(frameId)
	renderer.dispose()
	scene.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return
		object.geometry.dispose()
		const materials = Array.isArray(object.material) ? object.material : [object.material]
		materials.forEach((material) => material.dispose())
	})
	element.replaceChildren()
}
```

If you add pointer or keyboard listeners, remove them in this same cleanup function. GPU resources
are not automatically released just because a React component disappeared.

### Step 9: Add drag-to-rotate

For a basic orbit control, keep two angles in normal JavaScript variables inside the effect. When the
pointer moves, change the angles and compute the camera position around a fixed target. Use pointer
capture so a drag continues even if the cursor briefly leaves the canvas.

```ts
let azimuth = Math.PI / 4
let elevation = 0.7
const radius = 22
const target = new THREE.Vector3(0, 1, 0)

function updateCamera() {
	const horizontal = radius * Math.cos(elevation)
	camera.position.set(
		target.x + horizontal * Math.sin(azimuth),
		target.y + radius * Math.sin(elevation),
		target.z + horizontal * Math.cos(azimuth),
	)
	camera.lookAt(target)
}
```

Remember the pointer's previous x/y values. Horizontal movement changes azimuth; vertical movement
changes elevation. Clamp elevation to prevent the camera from turning upside down. In a game where
tap-to-move and drag-to-rotate share a pointer, treat a gesture as a drag only after it passes a
small movement threshold. Otherwise a simple tap would rotate the camera instead of moving the
character.

For a production orbit camera with pan and zoom, the official Three.js `OrbitControls` addon is a
good option. This game uses a small custom controller so its controls stay limited to the intended
fixed-camera experience.

### Step 10: Convert a tap into a world position

The pointer's pixel position is not a 3D coordinate. Convert it to normalized device coordinates,
then raycast:

```ts
const pointer = new THREE.Vector2(
	((event.clientX - bounds.left) / bounds.width) * 2 - 1,
	-((event.clientY - bounds.top) / bounds.height) * 2 + 1,
)
raycaster.setFromCamera(pointer, camera)

const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const destination = raycaster.ray.intersectPlane(ground, new THREE.Vector3())
```

The formula maps the top-left of the canvas to `(-1, +1)` and bottom-right to `(+1, -1)`. A ray
from the camera passes through that screen position. Intersecting it with a horizontal plane at
`y = 0` gives the floor destination. If the intersection is `null`, there was no valid hit.

Clamp the destination to your room bounds. A more advanced game can raycast against actual floor
meshes, collision geometry or a navigation mesh instead of an infinite plane.

### Step 11: Animate the character

For simple movement, interpolate from the current position to the target over time. Use
`requestAnimationFrame` rather than a fixed number of pixels per frame; animation-frame timing varies
between devices.

```ts
const start = character.position.clone()
const end = destination.clone()
const startedAt = performance.now()
const duration = 900

function animate(now: number) {
	const progress = Math.min(1, (now - startedAt) / duration)
	const eased = progress * progress * (3 - 2 * progress)
	character.position.lerpVectors(start, end, eased)
	renderer.render(scene, camera)
	if (progress < 1) requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
```

The easing expression starts and ends gently. For a walk cycle, create separate arm and leg pivot
groups and rotate them in opposite directions with a sine wave while the character moves. For a
larger character, use a rigged model and animation clips instead of manually rotating primitive
parts.

### Step 12: Connect React buttons to game rules

Do not put game economy rules inside Three.js pointer handlers. Pass callbacks from React down to
scene hotspots. A scene button can call `doActivity('study_room')`; the Zustand action looks up the
activity definition, checks its location and requirements, applies needs/time/money/stat changes,
then persists the result. This keeps the scene renderer responsible for display and input while the
store remains the authority for game rules.

## 8. Extending the Game Safely

### Add an activity

1. Add an `ActivityDef` in `src/game/ActivitiesSystem.ts`.
2. Define its location, label, duration, costs, requirements and `run` result.
3. Add a hotspot with the same activity ID in that location's React scene component.
4. Add an activity animation cue in `Environment3D.tsx` if it deserves a distinct gesture.
5. Add a focused assertion in `src/verify.ts` for the rule or reward.

The activity store action checks availability before calling `run`. Do not trust the UI button's
disabled state as the only validation; game actions should validate again in the store.

### Add a shop item

Add the item to the catalog in `src/game/EconomySystem.ts`, then use the existing `purchase` action.
The catalog and purchase validation are the source of truth for prices, ownership and affordability.

### Add a character style

Appearance data is defined in `src/game/appearance.ts`, selected in `CharacterCreator.tsx`, and
stored in the player profile. Update both the UI avatar and the Three.js player if the new style
should appear in both renderers. If the game needs many animations or detailed clothing, prefer a
properly rigged GLTF asset over adding dozens of primitive meshes by hand.

### Add a message or phone feature

Keep UI state such as the currently selected conversation in a React component. Put persistent
effects such as relationship increases, money changes or time costs in `GameState.ts` so they pass
through the same save, mission and validation flow as other game actions.

## 9. Saves and Verification

Game progress is saved in browser `localStorage`. The save system has a version and sanitizes loaded
data before the game uses it. When adding a new persistent field, update the save type, default save
creation, and save sanitization/migration logic together.

The project includes a browser-based verification page. Start the dev server and open:

```text
http://localhost:5173/verify.html
```

It runs `src/verify.ts` and reports a `VERIFY_OK` or `VERIFY_FAIL` page title. The checks cover game
rules, persistence, schedule, economy, relationships, events, missions and store actions. After
changing Three.js rendering, also test the actual game at a desktop and narrow mobile viewport:

- Check that the canvas fills its parent and does not create page-level horizontal scrolling.
- Rotate through a full turn and confirm interior cutaway walls do not hide the room.
- Tap an open floor point and confirm the player moves there.
- Click an activity hotspot and confirm the store still validates and applies its effects.
- Switch locations and phases, then confirm old renderers and event listeners are cleaned up.

## 10. Troubleshooting

### `Cannot find module 'three'`

Run `npm install` from the project root. If `package.json` was changed but the lockfile or
`node_modules` is stale, use `npm install` again before running the build.

### A blank canvas

Check the browser console for WebGL errors. Confirm the renderer's host element has nonzero width
and height, that the camera points at the environment, and that the scene has both geometry and
lighting. Some browsers or remote sessions disable WebGL; show a fallback message if renderer
construction fails.

### A huge or cropped canvas

Give the scene container a defined size, call `renderer.setSize(width, height)`, and update the
camera projection when the aspect ratio changes. In nested flex layouts, use `min-height: 0` on the
flex child that contains the scene so it is allowed to shrink.

### The scene gets slower after changing locations

Look for missing effect cleanup. Disconnect observers, remove listeners, cancel animation frames,
dispose geometries and materials, dispose the renderer, and remove its canvas before creating the
next scene.

## Notes

All students, events and locations are fictional. This is a fan-made project and is not affiliated
with or endorsed by Babcock University. In-game currency has no real-world value.
