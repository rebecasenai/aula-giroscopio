import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  PanResponder,
  SafeAreaView,
} from 'react-native';
import { Gyroscope } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 46;
const ORB_SIZE = 34;

// Cores vibrantes do arco-íris
const RAINBOW_COLORS = [
  { main: '#ef4444', glow: '#f87171', border: '#fecaca' }, // Vermelho
  { main: '#f97316', glow: '#fb923c', border: '#ffedd5' }, // Laranja
  { main: '#eab308', glow: '#facc15', border: '#fef08a' }, // Amarelo
  { main: '#22c55e', glow: '#4ade80', border: '#bbf7d0' }, // Verde
  { main: '#06b6d4', glow: '#22d3ee', border: '#cffafe' }, // Ciano
  { main: '#3b82f6', glow: '#60a5fa', border: '#dbeafe' }, // Azul
  { main: '#8b5cf6', glow: '#a78bfa', border: '#ede9fe' }, // Violeta
  { main: '#ec4899', glow: '#f472b6', border: '#fce7f3' }, // Rosa
];

// Função para gerar posição aleatória segura dentro da área jogável
const generateRandomPosition = () => {
  const minX = 20;
  const maxX = width - ORB_SIZE - 20;
  const minY = 160;
  const maxY = height - ORB_SIZE - 120;

  return {
    x: Math.floor(Math.random() * (maxX - minX)) + minX,
    y: Math.floor(Math.random() * (maxY - minY)) + minY,
  };
};

export default function JogoColeteOrbe() {
  const [playerPosition, setPlayerPosition] = useState({
    x: (width - PLAYER_SIZE) / 2,
    y: (height - PLAYER_SIZE) / 2,
  });

  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [sensorValues, setSensorValues] = useState({ x: 0, y: 0, z: 0 });
  const [isSensorAvailable, setIsSensorAvailable] = useState(true);

  // Cores dinâmicas do arco-íris para o jogador e para o orbe alvo
  const playerColor = RAINBOW_COLORS[colorIndex % RAINBOW_COLORS.length];
  const orbColor = RAINBOW_COLORS[(colorIndex + 1) % RAINBOW_COLORS.length];

  // Refs de física para loop contínuo sem lag de re-renderização
  const posRef = useRef({
    x: (width - PLAYER_SIZE) / 2,
    y: (height - PLAYER_SIZE) / 2,
  });
  const velRef = useRef({ vx: 0, vy: 0 });
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });
  const orbRef = useRef(orbPosition);
  orbRef.current = orbPosition;

  // 1. Inicia o giroscópio
  useEffect(() => {
    Gyroscope.isAvailableAsync().then(available => {
      setIsSensorAvailable(available);
    });

    Gyroscope.setUpdateInterval(16); // ~60fps

    const subscription = Gyroscope.addListener(data => {
      gyroRef.current = data;
      setSensorValues(data);
    });

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  // 2. Loop de física a 60 FPS (Inércia, aceleração, atrito e colisão)
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const gyro = gyroRef.current;
      const vel = velRef.current;
      const pos = posRef.current;

      const accel = 2.2;
      vel.vx = (vel.vx - gyro.y * accel) * 0.93; // atrito
      vel.vy = (vel.vy - gyro.x * accel) * 0.93;

      const maxSpeed = 22;
      vel.vx = Math.max(-maxSpeed, Math.min(maxSpeed, vel.vx));
      vel.vy = Math.max(-maxSpeed, Math.min(maxSpeed, vel.vy));

      let nextX = pos.x + vel.vx;
      let nextY = pos.y + vel.vy;

      const minX = 0;
      const maxX = width - PLAYER_SIZE;
      const minY = 140;
      const maxY = height - PLAYER_SIZE - 30;

      if (nextX <= minX) {
        nextX = minX;
        vel.vx = -vel.vx * 0.5;
      } else if (nextX >= maxX) {
        nextX = maxX;
        vel.vx = -vel.vx * 0.5;
      }

      if (nextY <= minY) {
        nextY = minY;
        vel.vy = -vel.vy * 0.5;
      } else if (nextY >= maxY) {
        nextY = maxY;
        vel.vy = -vel.vy * 0.5;
      }

      pos.x = nextX;
      pos.y = nextY;
      setPlayerPosition({ x: nextX, y: nextY });

      // Verificação de colisão
      const playerCenterX = nextX + PLAYER_SIZE / 2;
      const playerCenterY = nextY + PLAYER_SIZE / 2;
      const orbCenterX = orbRef.current.x + ORB_SIZE / 2;
      const orbCenterY = orbRef.current.y + ORB_SIZE / 2;

      const dx = playerCenterX - orbCenterX;
      const dy = playerCenterY - orbCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const hitRadius = PLAYER_SIZE / 2 + ORB_SIZE / 2;

      if (distance < hitRadius) {
        // Incrementa pontuação e avança para a próxima cor do arco-íris
        setScore(prev => {
          const newScore = prev + 1;
          setHighScore(h => Math.max(h, newScore));
          return newScore;
        });

        setColorIndex(prev => prev + 1);

        const newPos = generateRandomPosition();
        setOrbPosition(newPos);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Suporte a arrastar na tela caso esteja sem sensor
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        velRef.current.vx += gestureState.vx * 3;
        velRef.current.vy += gestureState.vy * 3;
      },
    })
  ).current;

  const resetGame = () => {
    posRef.current = {
      x: (width - PLAYER_SIZE) / 2,
      y: (height - PLAYER_SIZE) / 2,
    };
    velRef.current = { vx: 0, vy: 0 };
    setPlayerPosition({ ...posRef.current });
    setScore(0);
    setColorIndex(0);
    setOrbPosition(generateRandomPosition());
  };

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Cabeçalho */}
      <View style={styles.hud}>
        <View style={styles.scoreBlock}>
          <Text style={styles.hudLabel}>ORBES</Text>
          <Text style={[styles.hudValue, { color: playerColor.glow }]}>{score}</Text>
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.title}>COLETA DE ORBES</Text>
        </View>

        <View style={styles.scoreBlock}>
          <Text style={styles.hudLabel}>RECORDE</Text>
          <Text style={styles.hudRecord}>{highScore}</Text>
        </View>
      </View>

      {/* Orbe Alvo (Cor do Arco-Íris) */}
      <View
        style={[
          styles.orb,
          {
            left: orbPosition.x,
            top: orbPosition.y,
            backgroundColor: orbColor.main,
            shadowColor: orbColor.glow,
            borderColor: orbColor.border,
          },
        ]}
      >
        <View style={styles.orbInner} />
      </View>

      {/* Jogador (Cor do Arco-Íris) */}
      <View
        style={[
          styles.player,
          {
            left: playerPosition.x,
            top: playerPosition.y,
            backgroundColor: playerColor.main,
            shadowColor: playerColor.glow,
            borderColor: playerColor.border,
          },
        ]}
      >
        <View style={styles.playerCore} />
      </View>

      {/* Rodapé informativo */}
      <View style={styles.footer}>
        <Text style={styles.instructions}>
          {isSensorAvailable
            ? 'Incline e gire o celular para guiar a esfera até o orbe.'
            : 'Deslize o dedo na tela para movimentar a esfera.'}
        </Text>

        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.debugText}>
          Giroscópio | X: {sensorValues.x.toFixed(1)} | Y: {sensorValues.y.toFixed(1)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1120',
  },
  scoreBlock: {
    alignItems: 'center',
  },
  hudLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  hudValue: {
    fontSize: 30,
    fontWeight: '900',
  },
  hudRecord: {
    color: '#fbbf24',
    fontSize: 30,
    fontWeight: '900',
  },
  centerBlock: {
    alignItems: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
  },
  playerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 2,
  },
  orbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  resetButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetButtonText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  debugText: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
  },
});
