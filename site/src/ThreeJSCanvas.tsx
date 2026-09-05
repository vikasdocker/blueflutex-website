import { useRef, useEffect } from "react"
import * as THREE from "three"

export default function useThreejs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x080c18, 1)
    containerRef.current.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 150

    // Ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))

    // Directional lights
    const dir1 = new THREE.DirectionalLight(0x00d4ff, 0.6)
    dir1.position.set(50, 50, 50)
    scene.add(dir1)

    const dir2 = new THREE.DirectionalLight(0x8cebff, 0.4)
    dir2.position.set(-50, -50, 50)
    scene.add(dir2)

    // Point light
    const pointLight = new THREE.PointLight(0x00d4ff, 0.5, 200)
    pointLight.position.set(0, 100, 0)
    scene.add(pointLight)

    // Starfield
    const starCount = 500
    const stars = new THREE.Group()
    for (let i = 0; i < starCount; i++) {
      const geometry = new THREE.SphereGeometry(
        Math.random() * 2 + 0.5,
        8,
        8
      )
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x00d4ff : 0x8cebff,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.3,
      })
      const star = new THREE.Mesh(geometry, material)

      const radius = 200 + Math.random() * 800
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      star.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )

      star.scale.setScalar(Math.random() * 0.5 + 0.2)
      star.userData.speed = Math.random() * 0.0001 + 0.00005
      stars.add(star)
    }
    scene.add(stars)

    // Rotating rings
    const rings: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.RingGeometry(20 + i * 30, 30 + i * 30, 32)
      const material = new THREE.MeshBasicMaterial({
        color: [0x00d4ff, 0x8cebff, 0x7dceff][i],
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(geometry, material)
      ring.rotation.x = Math.PI / 2
      ring.position.z = 100 + i * 40
      ring.userData.speed = (i + 1) * 0.001
      rings.push(ring)
      scene.add(ring)
    }

    // Animation loop
    let animationId: ReturnType<typeof requestAnimationFrame>
    function animate() {
      animationId = requestAnimationFrame(animate)

      stars.rotation.y += 0.001
      rings.forEach((ring) => (ring.rotation.z += ring.userData.speed))

      renderer.render(scene, camera)
    }

    animate()

    // Resize handler
    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    })

    return () => {
      cancelAnimationFrame(animationId)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return containerRef
}