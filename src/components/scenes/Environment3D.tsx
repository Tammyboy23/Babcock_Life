import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { LocationId, TimePhase } from '../../types'

type Point = [number, number, number]

function material(color: string, roughness = 0.86) {
  return new THREE.MeshStandardMaterial({ color, roughness })
}

function box(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color))
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

function cylinder(
  group: THREE.Group,
  x: number,
  y: number,
  z: number,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 12),
    material(color),
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

function sphere(group: THREE.Group, x: number, y: number, z: number, radius: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material(color))
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  group.add(mesh)
  return mesh
}

function line(group: THREE.Group, from: Point, to: Point, color: string, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ])
  const stroke = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  )
  group.add(stroke)
}

function person(group: THREE.Group, x: number, z: number, shirt: string, scale = 1, isPlayer = false) {
  const character = new THREE.Group()
  character.position.set(x, 0, z)
  character.name = isPlayer ? 'player' : 'resident'
  const torso = cylinder(character, 0, 0.62 * scale, 0, 0.24 * scale, 0.3 * scale, 0.8 * scale, shirt)
  const head = sphere(character, 0, 1.22 * scale, 0, 0.22 * scale, '#9a654b')
  const hair = sphere(character, 0, 1.27 * scale, -0.04 * scale, 0.22 * scale, '#211c1b')
  const leftArm = cylinder(character, -0.27 * scale, 0.68 * scale, 0, 0.075 * scale, 0.085 * scale, 0.5 * scale, shirt)
  const rightArm = cylinder(character, 0.27 * scale, 0.68 * scale, 0, 0.075 * scale, 0.085 * scale, 0.5 * scale, shirt)
  const leftLeg = cylinder(character, -0.12 * scale, 0.12 * scale, 0, 0.08 * scale, 0.09 * scale, 0.24 * scale, '#29313b')
  const rightLeg = cylinder(character, 0.12 * scale, 0.12 * scale, 0, 0.08 * scale, 0.09 * scale, 0.24 * scale, '#29313b')
  if (isPlayer) {
    torso.name = 'player-outfit'
    head.name = 'player-skin'
    hair.name = 'player-hair'
    leftArm.name = 'player-left-arm'
    rightArm.name = 'player-right-arm'
    leftLeg.name = 'player-left-leg'
    rightLeg.name = 'player-right-leg'
  }
  group.add(character)
  return character
}

function table(group: THREE.Group, x: number, z: number, color = '#a76f42') {
  box(group, x, 1.12, z, 2.1, 0.16, 1.1, color)
  box(group, x - 0.78, 0.55, z, 0.12, 1.12, 0.12, '#68432e')
  box(group, x + 0.78, 0.55, z, 0.12, 1.12, 0.12, '#68432e')
}

function tree(group: THREE.Group, x: number, z: number, size = 1) {
  cylinder(group, x, 1.25 * size, z, 0.18 * size, 0.26 * size, 2.5 * size, '#79533b')
  sphere(group, x, 2.9 * size, z, 1.05 * size, '#53844e')
  sphere(group, x - 0.58 * size, 2.55 * size, z + 0.08, 0.7 * size, '#719c58')
  sphere(group, x + 0.55 * size, 2.56 * size, z - 0.08, 0.74 * size, '#47784b')
}

function buildRoom(group: THREE.Group, floorColor: string, wallColor: string) {
  box(group, 0, -0.18, 0, 20, 0.36, 15, floorColor)
  box(group, 0, 3.05, -7.3, 20, 6.4, 0.3, wallColor).name = 'room-back-wall'
  box(group, -9.85, 3.05, 0, 0.3, 6.4, 15, wallColor).name = 'room-left-wall'
  box(group, 9.85, 3.05, 0, 0.3, 6.4, 15, wallColor).name = 'room-right-wall'
  box(group, 0, 0.04, -7.08, 19.4, 0.14, 0.14, '#d5c6ac')
}

function buildHostel(group: THREE.Group) {
  buildRoom(group, '#a77e57', '#ddd2bf')
  box(group, -5.2, 1.8, -7.08, 4.2, 2.7, 0.12, '#8ec3d1')
  box(group, -5.2, 1.8, -6.96, 0.12, 2.9, 0.16, '#f2eee5')
  box(group, -5.2, 1.8, -6.94, 4.3, 0.12, 0.16, '#f2eee5')
  box(group, -5.7, 0.42, -2.6, 4.2, 0.72, 2.4, '#7e5a3c')
  box(group, -5.7, 0.9, -2.6, 4.0, 0.32, 2.3, '#e6e5dc')
  box(group, -6.8, 1.1, -3.3, 1.1, 0.22, 0.72, '#faf8f1')
  box(group, 0.7, 0.75, -2.6, 3.4, 0.16, 1.25, '#8c5e3b')
  box(group, 0.7, 0.36, -2.6, 0.18, 0.78, 0.18, '#67472f')
  box(group, 0.7, 1.72, -3.1, 1.35, 1.55, 0.16, '#263445')
  box(group, 6.3, 1.65, -4.5, 2.2, 3.3, 1.25, '#85552f')
  box(group, 6.3, 1.65, -3.83, 0.08, 3.2, 0.06, '#d5a66a')
  box(group, -1.2, 0.03, 1.8, 4.8, 0.08, 3.4, '#bc916b')
  person(group, 2.1, 1, '#397aa2', 0.9, true)
}

function buildCafeteria(group: THREE.Group) {
  buildRoom(group, '#c9aa7b', '#eddfc8')
  box(group, 0, 1.65, -6.75, 10.5, 2.3, 0.5, '#39454c')
  box(group, 0, 2.2, -6.43, 9.8, 1.1, 0.12, '#202a30')
  box(group, 0, 1.05, -2.6, 14, 0.3, 1.45, '#b96f43')
  box(group, 0, 0.52, -2.6, 13.7, 0.86, 1.25, '#d18a55')
  for (const x of [-5.5, -2.1, 2.1, 5.5]) cylinder(group, x, 1.37, -2.55, 0.42, 0.42, 0.18, '#dce3e4')
  table(group, -4.8, 2.1, '#bf8c54')
  table(group, 0, 2.5, '#bf8c54')
  table(group, 4.8, 2.1, '#bf8c54')
  for (const [index, x] of [-6, -1.4, 3.2].entries()) person(group, x, 1.3, '#417c69', 0.92, index === 0)
}

function buildLecture(group: THREE.Group) {
  buildRoom(group, '#777e8b', '#d6d8df')
  box(group, 0, 2.55, -7.02, 9.2, 2.7, 0.12, '#f5f3ed')
  box(group, 0, 2.5, -6.92, 0.08, 2.4, 0.12, '#aab2b8')
  box(group, -4.3, 0.82, -4.3, 2.2, 1.4, 1.2, '#93643f')
  for (let row = 0; row < 3; row += 1) {
    for (let seat = 0; seat < 7; seat += 1) {
      const x = -6.3 + seat * 2.1 + row * 0.35
      const z = -1.8 + row * 2
      box(group, x, 0.95, z, 1.25, 0.16, 0.75, '#53677b')
      box(group, x, 0.65, z + 0.31, 1.15, 0.5, 0.12, '#667c91')
    }
  }
  person(group, 1.8, 2.1, '#2f739b', 0.94, true)
  person(group, -2.8, 0.8, '#a34f48', 0.88)
}

function buildLibrary(group: THREE.Group) {
  buildRoom(group, '#9c7958', '#e4d8c6')
  for (const x of [-7.2, 7.2]) {
    box(group, x, 2.05, -5.7, 2.5, 4.1, 0.75, '#744a30')
    for (let shelf = 0; shelf < 4; shelf += 1) {
      const y = 0.68 + shelf * 0.9
      box(group, x, y, -5.23, 2.35, 0.12, 0.8, '#ae7949')
      for (let book = 0; book < 8; book += 1) {
        const colors = ['#9e4e3e', '#34789a', '#547a55', '#bd8b3c', '#78618f']
        box(group, x - 0.92 + book * 0.26, y + 0.3, -5.28, 0.2, 0.53, 0.48, colors[(book + shelf) % colors.length])
      }
    }
  }
  table(group, -2.4, 0.2)
  table(group, 2.4, 1.8)
  person(group, -2.5, 1.5, '#4e7787', 0.88, true)
  person(group, 2.4, 0.2, '#826048', 0.88)
}

function buildSports(group: THREE.Group) {
  box(group, 0, -0.3, 0, 24, 0.5, 20, '#4c9557')
  box(group, 0, -0.02, 0, 14, 0.06, 10, '#b77847')
  for (const z of [-4.7, 4.7]) line(group, [-7, 0.03, z], [7, 0.03, z], '#f4f0de')
  for (const x of [-6.9, 6.9]) line(group, [x, 0.03, -4.7], [x, 0.03, 4.7], '#f4f0de')
  line(group, [0, 0.04, -4.7], [0, 0.04, 4.7], '#f4f0de')
  for (const x of [-8, 8]) {
    box(group, x, 0.8, -1.8, 0.18, 1.6, 0.18, '#ece8dc')
    box(group, x, 1.6, -1.8, 2.4, 0.18, 0.18, '#ece8dc')
    box(group, x, 0.8, 1.5, 0.18, 1.6, 0.18, '#ece8dc')
    box(group, x, 1.6, 1.5, 2.4, 0.18, 0.18, '#ece8dc')
  }
  box(group, 0, 1.1, -7.7, 10.5, 2.2, 0.35, '#8793a0')
  person(group, -1.1, 0.1, '#e4dfce', 1.02, true)
  person(group, 2.2, -2.1, '#bd5546', 0.95)
  tree(group, -10, -3, 0.85)
  tree(group, 10, -4, 0.95)
}

function buildShop(group: THREE.Group) {
  buildRoom(group, '#a7aca3', '#dbe3d9')
  for (const x of [-6.2, -2.3, 2.1]) {
    box(group, x, 1.8, -5.7, 2.45, 3.6, 0.7, '#a5b0ae')
    for (let shelf = 0; shelf < 3; shelf += 1) {
      box(group, x, 0.8 + shelf * 0.95, -5.25, 2.3, 0.12, 0.8, '#7d8987')
      for (let item = 0; item < 5; item += 1) {
        const color = ['#df8650', '#4e9a7b', '#d2bd5f', '#6799c1', '#b96776'][item]
        box(group, x - 0.86 + item * 0.42, 1.13 + shelf * 0.95, -5.32, 0.3, 0.48, 0.4, color)
      }
    }
  }
  box(group, 5, 0.84, -1.3, 6.5, 1.65, 1.4, '#37855a')
  box(group, 4.8, 1.74, -1.25, 1.4, 0.18, 0.8, '#233443')
  person(group, 5.9, -0.1, '#3b7397', 0.92, true)
}

function buildHangout(group: THREE.Group) {
  box(group, 0, -0.3, 0, 24, 0.5, 20, '#799765')
  box(group, 0, -0.02, 0, 9, 0.06, 12, '#b6a079')
  for (const [x, z, size] of [[-8, -5, 1.1], [8, -4, 1], [-9, 5, 0.9], [9, 5, 1.15]] as const) {
    tree(group, x, z, size)
  }
  for (const z of [-2, 3]) {
    box(group, -3.2, 0.7, z, 2.6, 0.18, 0.65, '#986443')
    box(group, -3.2, 0.45, z, 2.4, 0.18, 0.52, '#76513a')
    box(group, 3.2, 0.7, z, 2.6, 0.18, 0.65, '#986443')
    box(group, 3.2, 0.45, z, 2.4, 0.18, 0.52, '#76513a')
  }
  person(group, -1.6, 1, '#c45d50', 0.9, true)
  person(group, 1.5, -1, '#437b9a', 0.92)
}

function buildEvent(group: THREE.Group) {
  box(group, 0, -0.3, 0, 24, 0.5, 20, '#63865b')
  box(group, 0, 0.62, -6, 9.8, 1.3, 1.2, '#986044')
  box(group, 0, 2.05, -6.55, 12, 1.35, 0.22, '#3b6384')
  for (let index = 0; index < 7; index += 1) {
    const x = -5.2 + index * 1.7
    sphere(group, x, 3.35, -6.36, 0.11, '#f4d889')
    line(group, [x, 3.25, -6.4], [x + 0.8, 2.75, -6.4], '#e4d7ae', 0.7)
  }
  for (const x of [-8, 8]) {
    box(group, x, 1.6, 0, 3.2, 3.2, 2.8, x < 0 ? '#d0a56c' : '#b67b55')
    box(group, x, 3.25, 0, 3.6, 0.22, 3.2, '#f2dfbd')
  }
  for (let index = 0; index < 7; index += 1) {
    person(group, -6 + index * 2, 2.1 + (index % 2) * 1.2, ['#9a5262', '#487b75', '#bf8c42'][index % 3], 0.82)
  }
  person(group, 0, 0.7, '#d1b15a', 0.96, true)
}

const BUILDERS: Record<LocationId, (group: THREE.Group) => void> = {
  hostel: buildHostel,
  cafeteria: buildCafeteria,
  lecture: buildLecture,
  library: buildLibrary,
  sports: buildSports,
  shop: buildShop,
  hangout: buildHangout,
  event: buildEvent,
}

const SKY: Record<TimePhase, string> = {
  Morning: '#9bc9d4',
  Afternoon: '#83b8d0',
  Evening: '#d79479',
  Night: '#26364a',
}

export function Environment3D({
  location,
  phase,
  activityCue,
}: {
  location: LocationId
  phase: TimePhase
  activityCue: { id: string; key: number } | null
}) {
  const host = useRef<HTMLDivElement>(null)
  const cameraState = useRef<{ location: LocationId; azimuth: number; elevation: number } | null>(null)
  const playerPositions = useRef(new Map<LocationId, { x: number; y: number; z: number; rotation: number }>())

  useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SKY[phase])
    scene.fog = new THREE.Fog(SKY[phase], 24, 58)

    const viewHeight = 14.5
    const camera = new THREE.OrthographicCamera(-viewHeight / 2, viewHeight / 2, viewHeight / 2, -viewHeight / 2, 0.1, 100)
    camera.position.set(12, 15, 17)
    camera.lookAt(0, 1.2, 0)

    const ambient = new THREE.HemisphereLight('#f2ebd8', '#59606a', phase === 'Night' ? 1.1 : 1.65)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(phase === 'Night' ? '#b8c9f0' : '#fff0ce', phase === 'Night' ? 1.5 : 2.6)
    sun.position.set(-7, 12, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -15
    sun.shadow.camera.right = 15
    sun.shadow.camera.top = 15
    sun.shadow.camera.bottom = -15
    scene.add(sun)

    const environment = new THREE.Group()
    scene.add(environment)
    BUILDERS[location](environment)
    const player = environment.getObjectByName('player')
    const savedPlayer = playerPositions.current.get(location)
    if (player && savedPlayer) {
      player.position.set(savedPlayer.x, savedPlayer.y, savedPlayer.z)
      player.rotation.y = savedPlayer.rotation
    }

    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.055, 8, 28),
      new THREE.MeshBasicMaterial({ color: '#f5d36f', transparent: true, opacity: 0.9, depthWrite: false }),
    )
    marker.rotation.x = -Math.PI / 2
    marker.position.y = 0.04
    marker.visible = false
    marker.renderOrder = 2
    scene.add(marker)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      const fallback = document.createElement('div')
      fallback.className = 'flex h-full items-center justify-center bg-slate-900 text-sm text-slate-300'
      fallback.textContent = '3D view is unavailable in this browser.'
      element.appendChild(fallback)
      return () => element.replaceChildren()
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', `Fixed 3D view of ${location}`)
    renderer.domElement.style.cursor = 'grab'
    element.appendChild(renderer.domElement)

    let actionAnimationFrame = 0
    const actionFrame = activityCue
      ? requestAnimationFrame((started) => {
          const activity = activityCue.id
          const playerTorso = player?.getObjectByName('player-outfit')
          const leftArm = player?.getObjectByName('player-left-arm')
          const rightArm = player?.getObjectByName('player-right-arm')
          const leftLeg = player?.getObjectByName('player-left-leg')
          const rightLeg = player?.getObjectByName('player-right-leg')
          const duration = activity === 'sleep' ? 2400 : 1700

          const animateAction = (now: number) => {
            const progress = Math.min(1, (now - started) / duration)
            const pulse = Math.sin(progress * Math.PI * 6) * Math.sin(progress * Math.PI)
            const lift = Math.sin(progress * Math.PI)

            if (activity.includes('eat') || activity === 'buy_chapman') {
              if (rightArm) rightArm.rotation.x = -1.05 * lift
            } else if (activity === 'sleep' || activity === 'nap') {
              if (player) player.position.y = Math.sin(progress * Math.PI * 4) * 0.025
              if (playerTorso) playerTorso.rotation.z = Math.sin(progress * Math.PI * 2) * 0.035
            } else if (['workout', 'join_match', 'coach_session', 'table_tennis'].includes(activity)) {
              if (leftArm) leftArm.rotation.x = pulse * 0.8
              if (rightArm) rightArm.rotation.x = -pulse * 0.8
              if (leftLeg) leftLeg.rotation.x = pulse * 0.55
              if (rightLeg) rightLeg.rotation.x = -pulse * 0.55
              if (player) player.position.y = Math.abs(pulse) * 0.06
            } else if (activity.includes('chat') || activity.includes('gist') || activity.includes('network') || activity.includes('friends')) {
              if (rightArm) {
                rightArm.rotation.x = -0.35 * lift
                rightArm.rotation.z = -0.9 * lift + Math.sin(progress * Math.PI * 8) * 0.18 * lift
              }
              if (playerTorso) playerTorso.rotation.z = Math.sin(progress * Math.PI * 4) * 0.06
            } else if (activity.includes('shower')) {
              if (leftArm) leftArm.rotation.z = 0.75 * lift
              if (rightArm) rightArm.rotation.z = -0.75 * lift
              if (playerTorso) playerTorso.rotation.x = -0.08 * lift
            } else if (activity.includes('study') || activity.includes('lecture') || activity.includes('research') || activity.includes('revise') || activity.includes('borrow')) {
              if (leftArm) leftArm.rotation.x = -0.45 + pulse * 0.12
              if (rightArm) rightArm.rotation.x = -0.6 + Math.abs(pulse) * 0.15
              if (playerTorso) playerTorso.rotation.x = -0.12 + Math.sin(progress * Math.PI * 4) * 0.025
            } else if (activity.includes('shift') || activity.includes('volunteer') || activity.includes('perform') || activity.includes('event')) {
              if (leftArm) leftArm.rotation.x = pulse * 0.45
              if (rightArm) rightArm.rotation.x = -pulse * 0.45
              if (activity.includes('perform') && rightArm) rightArm.rotation.z = -0.85 * lift
            } else {
              if (rightArm) rightArm.rotation.z = -0.55 * lift
              if (playerTorso) playerTorso.rotation.z = pulse * 0.04
            }

            renderer.render(scene, camera)
            if (progress < 1) actionAnimationFrame = requestAnimationFrame(animateAction)
            else {
              if (player) player.position.y = 0
              if (playerTorso) playerTorso.rotation.set(0, 0, 0)
              if (leftArm) leftArm.rotation.set(0, 0, 0)
              if (rightArm) rightArm.rotation.set(0, 0, 0)
              if (leftLeg) leftLeg.rotation.set(0, 0, 0)
              if (rightLeg) rightLeg.rotation.set(0, 0, 0)
              renderer.render(scene, camera)
            }
          }

          animateAction(started)
        })
      : 0

    const cameraTarget = new THREE.Vector3(0, 1.2, 0)
    const cameraOffset = camera.position.clone().sub(cameraTarget)
    const cameraRadius = cameraOffset.length()
    const savedCamera = cameraState.current?.location === location ? cameraState.current : null
    let cameraAzimuth = savedCamera?.azimuth ?? Math.atan2(cameraOffset.x, cameraOffset.z)
    let cameraElevation = savedCamera?.elevation ?? Math.atan2(cameraOffset.y, Math.hypot(cameraOffset.x, cameraOffset.z))
    let activePointer: { id: number; x: number; y: number; lastX: number; lastY: number; moved: boolean } | null = null
    let movementFrame = 0

    const updateCamera = () => {
      const horizontal = cameraRadius * Math.cos(cameraElevation)
      const directionX = Math.sin(cameraAzimuth)
      const directionZ = Math.cos(cameraAzimuth)
      camera.position.set(
        cameraTarget.x + horizontal * directionX,
        cameraTarget.y + cameraRadius * Math.sin(cameraElevation),
        cameraTarget.z + horizontal * directionZ,
      )
      camera.lookAt(cameraTarget)
      const backWall = environment.getObjectByName('room-back-wall')
      const leftWall = environment.getObjectByName('room-left-wall')
      const rightWall = environment.getObjectByName('room-right-wall')
      if (backWall) backWall.visible = directionZ > -0.2
      if (leftWall) leftWall.visible = directionX > -0.2
      if (rightWall) rightWall.visible = directionX < 0.2
    }
    updateCamera()

    const movePlayer = (event: PointerEvent) => {
      if (!player) return
      const bounds = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)
      const destination = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3())
      if (!destination) return

      const limit = location === 'hostel' || location === 'cafeteria' || location === 'lecture' || location === 'library' || location === 'shop' ? 8.6 : 10.5
      destination.x = THREE.MathUtils.clamp(destination.x, -limit, limit)
      destination.z = THREE.MathUtils.clamp(destination.z, -6.3, 6.3)
      const start = player.position.clone()
      const target = new THREE.Vector3(destination.x, 0, destination.z)
      const started = performance.now()
      const distance = start.distanceTo(target)
      const duration = THREE.MathUtils.clamp(distance * 240, 420, 2200)
      const strideCycles = Math.max(1, Math.round(distance * 0.9))
      const deltaX = target.x - start.x
      const deltaZ = target.z - start.z
      const leftLeg = player.getObjectByName('player-left-leg')
      const rightLeg = player.getObjectByName('player-right-leg')
      const leftArm = player.getObjectByName('player-left-arm')
      const rightArm = player.getObjectByName('player-right-arm')
      player.rotation.y = Math.atan2(deltaX, deltaZ)
      marker.position.set(target.x, 0.04, target.z)
      marker.visible = true

      cancelAnimationFrame(movementFrame)
      const animateMove = (now: number) => {
        const progress = Math.min(1, (now - started) / duration)
        const eased = progress * progress * (3 - 2 * progress)
        const stride = Math.sin(progress * Math.PI * strideCycles * 2) * 0.48
        player.position.lerpVectors(start, target, eased)
        player.position.y = start.y + Math.abs(stride) * 0.035
        playerPositions.current.set(location, {
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          rotation: player.rotation.y,
        })
        if (leftLeg) leftLeg.rotation.x = stride
        if (rightLeg) rightLeg.rotation.x = -stride
        if (leftArm) leftArm.rotation.x = -stride * 0.8
        if (rightArm) rightArm.rotation.x = stride * 0.8
        const markerMaterial = marker.material as THREE.MeshBasicMaterial
        markerMaterial.opacity = Math.max(0, 0.9 * (1 - progress))
        renderer.render(scene, camera)
        if (progress < 1) movementFrame = requestAnimationFrame(animateMove)
        else marker.visible = false
      }
      movementFrame = requestAnimationFrame(animateMove)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0) return
      activePointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      }
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!activePointer || activePointer.id !== event.pointerId) return
      const deltaX = event.clientX - activePointer.lastX
      const deltaY = event.clientY - activePointer.lastY
      if (Math.hypot(event.clientX - activePointer.x, event.clientY - activePointer.y) > 7) activePointer.moved = true
      if (activePointer.moved) {
        cameraAzimuth -= deltaX * 0.008
        cameraElevation = THREE.MathUtils.clamp(cameraElevation + deltaY * 0.005, 0.2, 1.15)
        cameraState.current = { location, azimuth: cameraAzimuth, elevation: cameraElevation }
        updateCamera()
        renderer.render(scene, camera)
      }
      activePointer.lastX = event.clientX
      activePointer.lastY = event.clientY
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!activePointer || activePointer.id !== event.pointerId) return
      const didMoveCamera = activePointer.moved
      activePointer = null
      renderer.domElement.style.cursor = 'grab'
      if (!didMoveCamera) movePlayer(event)
    }

    const onPointerCancel = () => {
      activePointer = null
      renderer.domElement.style.cursor = 'grab'
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerCancel)

    const resize = () => {
      const width = Math.max(1, element.clientWidth)
      const height = Math.max(1, element.clientHeight)
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.left = (-viewHeight * camera.aspect) / 2
      camera.right = (viewHeight * camera.aspect) / 2
      camera.top = viewHeight / 2
      camera.bottom = -viewHeight / 2
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()

    return () => {
      observer.disconnect()
      cancelAnimationFrame(movementFrame)
      if (actionFrame) cancelAnimationFrame(actionFrame)
      cancelAnimationFrame(actionAnimationFrame)
      cameraState.current = { location, azimuth: cameraAzimuth, elevation: cameraElevation }
      if (player) {
        playerPositions.current.set(location, {
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          rotation: player.rotation.y,
        })
      }
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerCancel)
      renderer.dispose()
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((entry) => entry.dispose())
      })
      element.replaceChildren()
    }
  }, [location, phase, activityCue?.key])

  return <div ref={host} className="absolute inset-0 overflow-hidden" />
}