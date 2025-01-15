import { useState, useEffect, useRef } from 'react';
import { LinearProgress, Button, Typography, Container } from '@mui/material';

const App = () => {
  const [decibels, setDecibels] = useState(0);
  const [calories, setCalories] = useState(0);
  const [lastSoundTime, setLastSoundTime] = useState(Date.now());
  const silenceDuration = 5000;
  const analyserRef = useRef(null);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;
        source.connect(analyser);

        const calculateDecibels = () => {
          const frequencyData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(frequencyData);
          let sum = 0;
          for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
          }
          const average = sum / frequencyData.length;
          const decibelLevel = 10 * Math.log10(average);
          return decibelLevel > -Infinity ? decibelLevel : 0;
        };

        const updateLevels = () => {
          const decibelLevel = calculateDecibels();
          setDecibels(decibelLevel);

          if (decibelLevel > 30) {
            setCalories(prev => prev + (decibelLevel - 30) * 0.1);
            setLastSoundTime(Date.now());
          } else if (Date.now() - lastSoundTime > silenceDuration) {
            setCalories(0);
          }

          requestAnimationFrame(updateLevels);
        };

        updateLevels();
      })
      .catch(err => console.error('Microphone access error:', err));

    return () => {
      audioContext.close(); // Clean up on component unmount
    };
  }, []);

  const resetValues = () => {
    setDecibels(0);
    setCalories(0);
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: 'center', paddingTop: '50px' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Real-Time Decibel and Calorie Monitor
      </Typography>
      <Typography variant="h6" color={decibels > 30 ? 'green' : 'red'}>
        Decibel Level: {decibels.toFixed(2)} dB
      </Typography>
      <LinearProgress variant="determinate" value={Math.min(decibels, 100)} style={{ height: 10, marginTop: 10 }} />
      <Typography variant="h6" color="secondary" style={{ marginTop: 20 }}>
        Calories Burnt: {calories.toFixed(2)} calories
      </Typography>
      <LinearProgress variant="determinate" value={Math.min(calories, 100)} style={{ height: 10, marginTop: 10 }} />
      <Button
        variant="contained"
        color="warning"
        onClick={resetValues}
        style={{ marginTop: 30 }}
      >
        RESET
      </Button>
    </Container>
  );
};

export default App;