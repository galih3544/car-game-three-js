import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import "./style.css";

function App() {
  const animationRef = useRef(null);
  const [second, setSecond] = useState(0);
  const [gameOver, setGameOver] = useState(0);
  const gameOverRef = useRef(null);
  const [gameOverScore, setGameOverScore] = useState(0);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 20;
    camera.position.y = 18;
    camera.position.x = 10;
      
    const canvas = document.getElementById("myGame");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: 1,
      antialias: true
    });
    renderer.setClearColor(0xffa500);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const control = new OrbitControls(camera, renderer.domElement);

    const al = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(al);

    const light = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(0, 10, 5);
    light.castShadow = true;
    scene.add(light);

    // const axesHelper = new THREE.AxesHelper(5);

    const gltfloader = new GLTFLoader();
    let player_model;
    gltfloader.load("./player.gltf", (gltfScene) => {
      player_model = gltfScene.scene;
      player_model.rotateY(-Math.PI / 2)
      player_model.scale.set(3,3,3);
      player_model.position.y = -2.6;
      player_model.castShadow = true;
      scene.add(gltfScene.scene);
    });

    const dLoader = new DRACOLoader();
    dLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dLoader.setDecoderConfig({ type: 'js' });
    gltfloader.setDRACOLoader(dLoader);

    // Bounding box player
    const box = new THREE.BoxGeometry(5, 5, 5);
    const playerBox = new THREE.Box3().setFromObject(new THREE.Mesh(box));

    const plane = new THREE.PlaneGeometry(20, 200, 50);
    const planematerial = new THREE.MeshPhongMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const planemesh = new THREE.Mesh(plane, planematerial);
    planemesh.rotation.x = Math.PI / 2;
    planemesh.position.y = -2.6;
    planemesh.receiveShadow = true;
    scene.add(planemesh);

    document.onkeydown = function (e) {
      if (e.key === "d") {
        if (player_model.position.x + 6 <= 6) {
          player_model.position.x += 6;
        }
      } else if (e.key === "a") {
        if (player_model.position.x - 6 >= -6) {
          player_model.position.x -= 6;
        }
      }
    
      playerBox.setFromObject(player_model);
    };

    let enemyBoxAll = [];
    let frames = 0;
    let spawnRate = 30;
    
    function enemySpawn() {
      if (frames % spawnRate === 0) {
        let enemy_model;
        const randomValue = Math.floor(Math.random() * 3);
        let type_enemy;
        const random_enemy_type = Math.floor(Math.random() * 2); 
        if(random_enemy_type === 0){
          type_enemy = "./enemy1.gltf";
        }else{
          type_enemy = "./enemy2.gltf";
        }

        gltfloader.load(type_enemy, (gltfScene) => {
          enemy_model = gltfScene.scene;
          enemy_model.scale.set(3, 3, 3);
          enemy_model.position.y = -2.6;
          enemy_model.rotateY(Math.PI / 2);
          enemy_model.position.z = -100;
    
          switch (randomValue) {
            case 0:
              enemy_model.position.x = 0;
              break;
            case 1:
              enemy_model.position.x = 6;
              break;
            case 2:
              enemy_model.position.x = -6;
              break;
          }
    
          scene.add(enemy_model);
    
          // Bounding box enemy
          const enemyBox = new THREE.Box3().setFromObject(enemy_model);
          enemyBoxAll.push(enemyBox);
    
          const animateEnemy = () => {
            if (enemy_model.position.z < 50) {
              enemy_model.position.z += 1;
              enemyBox.setFromObject(enemy_model);
              animationRef.current = requestAnimationFrame(animateEnemy);
            } else {
              scene.remove(enemy_model);
              const index = enemyBoxAll.indexOf(enemyBox);
              if (index > -1) {
                enemyBoxAll.splice(index, 1);
              }
            }
          };
    
          animateEnemy();
        });
      }
    
      frames++;
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    const animate = () => {
      control.update();
      renderer.render(scene, camera);
      enemySpawn();
    
      let isCollision = false;
      for (let i = 0; i < enemyBoxAll.length; i++) {
        if (playerBox.intersectsBox(enemyBoxAll[i])) {
          isCollision = true;
          break;
        }
      }
    
      if (isCollision === true) {
        setGameOver(1);
        cancelAnimationFrame(animationRef.current);
        return;
      }
    
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

    useEffect(() => {
      if(gameOver === 0){
        const timer = setInterval(() => {
          setSecond(prevSecond => prevSecond + 1);
        }, 1000);
    
        return () => {
          clearInterval(timer);
        };
      }else{
        setGameOverScore(second);
        if (gameOverRef.current) {
          const delayDisplay = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            gameOverRef.current.style.display = 'block';
          };
          delayDisplay();
        }
      }
    }, [gameOver]);
  return (
    <div>
      <canvas id='myGame'></canvas>
      <div id="score">
        <h1>waktu bertahan: {second}</h1>
      </div>
      <div id='gameOver' ref={gameOverRef}>
        <div id='textGameOver'>
          <h1>Game Over</h1>
          <h1>Waktu Bertahan: { second }</h1>
        </div>
      </div>
    </div>
  );
}

export default App;