import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface EarthSceneProps {
  width?: string
  height?: string
}

export default function EarthScene({ width = '100%', height = '100%' }: EarthSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const TOTAL_TEXTURES = 5
    let loadedCount = 0
    const onLoad = () => {
      loadedCount++
      setLoadProgress(Math.round((loadedCount / TOTAL_TEXTURES) * 100))
      if (loadedCount >= TOTAL_TEXTURES) setLoaded(true)
    }

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // --- Scene ---
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 6)

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = true
    controls.zoomSpeed = 1.2
    controls.enableRotate = true
    controls.rotateSpeed = 0.5
    controls.enablePan = true
    controls.panSpeed = 0.8
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2.5
    controls.maxDistance = 12
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
    }, { passive: false })

    // --- Textures ---
    const texLoader = new THREE.TextureLoader()
    const dayTex      = texLoader.load('/imgs/8k_earth_daymap.jpg', onLoad)
    const normalTex   = texLoader.load('/imgs/8k_earth_normal_map.png', onLoad)
    const specularTex = texLoader.load('/imgs/8k_earth_specular_map.png', onLoad)
    const displaceTex = texLoader.load('/imgs/EARTH_DISPLACE_8k_16BITS.jpg', onLoad)
    const cloudTex    = texLoader.load('/imgs/europe_clouds_8k.jpg', onLoad)

    // --- Earth Group ---
    const earthGroup = new THREE.Group()
    scene.add(earthGroup)

    // Earth surface
    const earthGeo = new THREE.SphereGeometry(2, 500, 500)
    const earthMat = new THREE.MeshPhongMaterial({
      map: dayTex,
      specularMap: specularTex,
      specular: new THREE.Color(0x111111),
      shininess: 25,
      normalMap: normalTex,
      displacementMap: displaceTex,
      displacementScale: 0.03,
    })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    earthGroup.add(earthMesh)

    // Cloud layer
    const cloudGeo = new THREE.SphereGeometry(2.03, 200, 200)
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudTex,
      side: THREE.DoubleSide,
      opacity: 0.75,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.MaxEquation,
    })
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
    earthGroup.add(cloudMesh)

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(2.2, 128, 128)
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x034d8e) },
      },
      vertexShader: `
        varying float vAlpha;
        void main() {
          vec4 viewPosition4 = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition4;
          float radius = length(position);
          vAlpha = smoothstep(2.2, 2.4, radius);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })
    const atmMesh = new THREE.Mesh(atmGeo, atmMat)
    earthGroup.add(atmMesh)

    // --- Lighting — pure white ambient, no color grading ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8)
    scene.add(ambientLight)

    // --- Star streaks (forward travel particles) ---
    const starGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 30
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, sizeAttenuation: true })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // --- Resize ---
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // --- Animation ---
    let t = 0
    const baseZ = 6
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      t++

      const thrust = Math.sin(t * 0.002) * 0.4
      camera.position.z = baseZ + thrust

      const positions = starGeo.attributes.position.array as Float32Array
      for (let i = 0; i < 200; i++) {
        positions[i * 3 + 2] += 0.04
        if (positions[i * 3 + 2] > 10) {
          positions[i * 3 + 2] = -40
        }
      }
      starGeo.attributes.position.needsUpdate = true

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width, height }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#000d1a',
        }}>
          <div style={{
            fontFamily: 'monospace', color: '#00e5ff',
            fontSize: '12px', letterSpacing: '2px', marginBottom: '16px',
          }}>
            LOADING EARTH DATA... {loadProgress}%
          </div>
          <div style={{ width: '200px', height: '2px', background: 'rgba(0,229,255,0.2)', borderRadius: '1px' }}>
            <div style={{
              height: '100%', borderRadius: '1px',
              background: '#00e5ff',
              width: `${loadProgress}%`,
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px #00e5ff',
            }} />
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
