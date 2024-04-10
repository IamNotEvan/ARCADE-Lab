import React, { useState, useEffect } from 'react'; // Import useState from React
import DataGraph from './DataGraph'; // Adjust the import path as necessary
import io from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const socket = io('http://localhost:5000');


function Drone() {
    const [isDroneConnected, setIsDroneConnected] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState('No Connection');
    const [frameSrc, setFrameSrc] = useState('');
    const [showGraph, setShowGraph] = useState(false);
    const [collectedData, setCollectedData] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const data = {
      labels: collectedData.map(item => new Date(item[0]).toLocaleTimeString()),
      datasets: [
        {
          label: 'Distance over Time',
          data: collectedData.map(item => item[1]),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
    
    const options = {
      scales: {
        x: {
          type: 'time',
          time: {
            displayFormats: {
              quarter: 'MMM YYYY'
            }
          }
        }
      }
    };

    const toggleGraph = () => {
      setShowGraph(!showGraph);
    };

    useEffect(() => {
        // Listen for battery level updates from the server
        socket.on('battery_update', (data) => {
          console.log('Battery update received:', data);
          setBatteryLevel(data.battery_level); // Update state with new battery level
        });
    
        // Clean up on component unmount
        return () => {
          socket.off('battery_update');
        };
    }, []);


    useEffect(() => {
        // Listen for video frame updates from the server
        socket.on('video_frame', (data) => {
        const src = `data:image/jpeg;base64,${data.image}`;
        setFrameSrc(src); // Update the image source with the received frame
        });

        // Clean up on component unmount
        return () => {
        socket.off('video_frame');
        };
    }, []);

  const connectToDrone = async () => {
    console.log('Connecting to drone...');
    try {
      const response = await fetch('http://localhost:5000/connect_drone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setIsDroneConnected(true);
      const data = await response.json();
      console.log('Success:', data);
      alert(`Connection Successful: ${data.message}`);
      socket.emit('start_stream');
    } catch (error) {
      console.error('Error connecting to drone:', error);
      alert(`Connection Failed: ${error.message}`);
    }
  };

  const takeSnapshot = async () => {
    console.log('Taking snapshot...');
    try {
      const response = await fetch('http://localhost:5000/take_snapshot', {
        method: 'GET', // Assuming this endpoint is accessed via GET
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Success:', data);
      alert(`Snapshot Successful: ${data.message}`);
      // Optionally handle the snapshot image here, e.g., display it or download it
    } catch (error) {
      console.error('Error taking snapshot:', error);
      alert(`Snapshot Failed: ${error.message}`);
    }
  };

  const changeCameraDirection = async () => {
    console.log('Changing camera direction...');

    try {
      const response = await fetch('http://localhost:5000/change_camera_direction', {
        method: 'POST', // Assuming this action is triggered by a POST request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success:', data);

      // Provide feedback to the user about the action's success
      alert(data.message);
    } catch (error) {
      console.error('Error changing camera direction:', error);
      alert(`Failed to change camera direction: ${error.message}`);
    }
  };

  

  const toggleDataCollection = async () => {
    const endpoint = isCollecting ? 'stop_collecting' : 'start_collecting';
    console.log(`${isCollecting ? 'Stopping' : 'Starting'} data collection...`);  

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success:', data);

      if (isCollecting) {
        // If stopping data collection, update the state with the collected data
        setCollectedData(data.data); // Assuming the server sends back the collected data under the key 'data'
        alert(`Data collection stopped. Data: ${JSON.stringify(data.data)}`);
      } else {
        // If starting data collection, potentially clear the previous collected data
        // setCollectedData([]); // Uncomment this line if you want to clear the data upon starting a new collection
        alert(`Data collection started.`);
      }
      setIsCollecting(!isCollecting); // Toggle the state to reflect the change
    } catch (error) {
      console.error('Error toggling data collection:', error);
      alert(`Data collection action failed: ${error.message}`);
    }
  };

  function toggleRecording() {
    fetch('http://localhost:5000/toggle_recording', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      // Assuming the backend response includes an "action" key
      if (data.action === "started") {
        setIsRecording(true);
      } else if (data.action === "stopped") {
        setIsRecording(false);
      }
      // Update UI based on response, if needed
    })
    .catch(error => {
      console.error('Error toggling recording:', error);
    });
  }

  // Assume `data` is prepared for your Line chart
  const GraphPopup = ({ toggleGraph }) => (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, background: 'white', padding: '20px', boxShadow: '0px 0px 8px rgba(0,0,0,0.5)' }}>
      <h2>Distance Measurement Over Time</h2>
      <Line data={data} />
      <button onClick={toggleGraph}>Close Graph</button>
    </div>
  );



  const toggleTakeoffLand = async () => {
    console.log('Toggling takeoff/land...');

    try {
      const response = await fetch('http://localhost:5000/takeoff_land', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success:', data);

      // Provide feedback to the user about the action's success
      alert(data.message);
    } catch (error) {
      console.error('Error toggling takeoff/land:', error);
      alert(`Failed to execute takeoff/land command: ${error.message}`);
    }
  };


    useEffect(() => {
        const handleKeyDown = (event) => {
          if (!isDroneConnected) return;

          let command = '';
          switch (event.key) {
              case 'w':
              command = 'w';
              break;
              case 'a':
              command = 'a';
              break;
              case 's':
              command = 's';
              break;
              case 'd':
              command = 'd';
              break;
              case 'ArrowUp':
              command = 'Up';
              break;
              case 'ArrowDown':
              command = 'Down';
              break;
              case 'ArrowLeft':
              command = 'Left';
              break;
              case 'ArrowRight':
              command = 'Right';
              break;
              default:
              return; // Ignore other keys
          }

          socket.emit('drone_command', { command });
          console.log(`Command sent: ${command}`);
        };

        const handleKeyUp = (event) => {
          if (!isDroneConnected) return; // Only proceed if the drone is connected

          let command = '';
          switch (event.key) {
              case 'w':
              case 'a':
              case 's':
              case 'd':
              case 'ArrowUp':
              case 'ArrowDown':
              case 'ArrowLeft':
              case 'ArrowRight':
              command = `release-${event.key === 'ArrowUp' ? 'Up' : 
                                      event.key === 'ArrowDown' ? 'Down' :
                                      event.key === 'ArrowLeft' ? 'Left' : 
                                      event.key === 'ArrowRight' ? 'Right' : event.key}`;
              break;
              default:
              return; // Ignore other keys
          }

          socket.emit('drone_command', { command });
          console.log(`Command sent: ${command}`);
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Clean up
        return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isDroneConnected]);


  
    // Function definitions for connectToDrone, takeSnapshot, toggleDataCollection, etc.
  
    return (
        <div className="Drone">
          <button onClick={connectToDrone}>Connect to Drone</button>
          <button onClick={toggleRecording} disabled={!isDroneConnected}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>         
          <button onClick={takeSnapshot} disabled={!isDroneConnected}>Take a Snapshot</button>
          <button onClick={toggleDataCollection} disabled={!isDroneConnected}>
            {isCollecting ? 'Stop Collecting Data' : 'Start Collecting Data'}
          </button>
          <button onClick={toggleTakeoffLand} disabled={!isDroneConnected}>Take Off / Land</button>
          <button onClick={changeCameraDirection} disabled={!isDroneConnected}>Change Camera Direction</button>
          <button onClick={toggleGraph} disabled={!isDroneConnected}>{showGraph ? 'Hide Data Graph' : 'Show Data Graph'}</button>
          {showGraph && <GraphPopup toggleGraph={toggleGraph} />}
          <h1>Drone Controller</h1>
          <div>
            <label htmlFor="batteryLevel">Battery Level: </label>
            <input
              type="text"
              id="batteryLevel"
              value={`${batteryLevel}%`}
              readOnly
            />
            <img src={frameSrc} alt="Drone View" style={{ width: '720px', height: '480px' }} />
          </div>
        </div>
      );
}
  
  export default Drone;