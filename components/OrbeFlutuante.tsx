import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Gyroscope } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const BALL_SIZE = 40;

export default function OrbeFlutuante() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState({
    x: (width - BALL_SIZE) / 2,
    y: (height - BALL_SIZE) / 2,
  });

  useEffect(() => {
    // 20ms garante ~50 atualizações por segundo para animação fluida
    Gyroscope.setUpdateInterval(20);

    const subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });

    return () => {
      subscription && subscription.remove();
    };
  }, []);

  useEffect(() => {
    const speed = 10;
    let newX = position.x - data.y * speed;
    let newY = position.y - data.x * speed;

    if (newX < 0) newX = 0;
    if (newX > width - BALL_SIZE) newX = width - BALL_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - BALL_SIZE) newY = height - BALL_SIZE;

    setPosition({ x: newX, y: newY });
  }, [data]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mova o celular!</Text>
      <View
        style={[
          styles.ball,
          {
            left: position.x,
            top: position.y,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  text: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: 'coral',
  },
});
