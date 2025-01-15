// src/App.js
import { useState, useEffect } from 'react';
import { LinearProgress, Button, Typography, Container } from '@mui/material';

const App = () => {
  const [decibels, setDecibels] = useState(0);
  const [calories, setCalories] = useState(0);
  const [lastSoundTime, setLastSoundTime] = useState(Date.now());
  const silenceDuration = 5000;

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        const dataArray = new Uint8Array(analyser.fftSize);
        source.connect(analyser);

        const calculateDecibels = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            let value = (dataArray[i] - 128) / 128;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const decibelLevel = 20 * Math.log10(rms);
          return decibelLevel > -Infinity ? decibelLevel + 100 : 0;
        };

        const updateLevels = () => {
          const decibelLevel = calculateDecibels();
          setDecibels(decibelLevel);
          if (decibelLevel > 30) {
            setCalories(prev => prev + (decibelLevel - 30) * 0.1);
            setLastSoundTime(Date.now());
          } else if (Date.now() - lastSoundTime > silenceDuration) {
            // Do nothing if silence persists
          }
          requestAnimationFrame(updateLevels);
        };

        updateLevels();
      })
      .catch(err => console.error('Microphone access error:', err));
  }, [lastSoundTime]);

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
        Reset
      </Button>
    </Container>
  );
};

export default App;
