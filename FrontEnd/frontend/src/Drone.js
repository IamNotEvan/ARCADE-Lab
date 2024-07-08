  import React, { useState, useEffect } from 'react'; // Import useState from React
  import io from 'socket.io-client';
  import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
  import { Chart } from "react-google-charts";

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
      const [missionPadData, setMissionPadData] = useState({ id: null, x: null, y: null, z: null });

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

    const GraphPopup = ({ data, toggleGraph }) => {

      const outlierThreshold = 500;

      // Data preparation for Google Charts
      const chartData = [
        ['Time', 'Distance'],
        ...data
          .filter(item => item[1] <= outlierThreshold)
          .map(item => [new Date(item[0]).toLocaleTimeString(), item[1]])
      ];
    
      const options = {
        title: 'Distance Measurement Over Time',
        hAxis: { title: 'Time', titleTextStyle: { color: '#333' } },
        vAxis: { minValue: 0, title: 'Distance', titleTextStyle: { color: '#333' } },
        legend: 'none'
      };
    
      return (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, background: 'white', padding: '20px', boxShadow: '0px 0px 8px rgba(0,0,0,0.5)', width: '80%', height: 'auto' }}>
          <h2>Distance Measurement Over Time</h2>
          <Chart
            chartType="LineChart"
            width="100%"
            height="400px"
            data={chartData}
            options={options}
          />
          <button onClick={toggleGraph}>Close Graph</button>
        </div>
      );
    };



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

      // Example using fetch

    const enableMissionPad = async () => {
      try {
        const response = await fetch('http://localhost:5000/enable_mission_pads', { method: 'POST' });
        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error('Error enabling mission pads:', error);
      }
    };

    const getMissionPadData = async () => {
      try {
        const response = await fetch('http://localhost:5000/get_mission_pad_data', { method: 'GET' });
        const data = await response.json();
        if (data.success && data.data) {
          setMissionPadData({
            id: data.data.pad_id,
            x: data.data.dist_x,
            y: data.data.dist_y,
            z: data.data.dist_z
          });
          alert(`Mission Pad Data: ID=${data.data.pad_id}, X=${data.data.dist_x}, Y=${data.data.dist_y}, Z=${data.data.dist_z}`);
        } else {
          setMissionPadData({ id: null, x: null, y: null, z: null });
          alert(data.message);
        }
      } catch (error) {
        console.error('Error fetching mission pad data:', error);
      }
    };

    const navigateToMissionPad = async () => {
      try {
        const response = await fetch('http://localhost:5000/navigate_to_mission_pad', { method: 'POST' });
        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error('Error navigating to mission pad:', error);
      }
    };


    
      // Function definitions for connectToDrone, takeSnapshot, toggleDataCollection, etc.
    
      return (
          <div className="Drone" style={{align: 'center', position: 'absolute',bottom: 1, left:10, width: '900px'}}>
            <img src={frameSrc} alt="Drone View" style={{ width: '900px', height: '675px'}} />
            <h1 style={{textAlign: 'center'}}>Drone Controller</h1>
            <div style={{marginBottom: '10px'}}>
              <label htmlFor="batteryLevel">Battery Level: </label>
              <input
                type="text"
                id="batteryLevel"
                value={`${batteryLevel}%`}
                readOnly
              />
            </div>
            <button onClick={connectToDrone} style={{height: '50px'}}>Connect to Drone</button>
            <button onClick={toggleRecording} disabled={!isDroneConnected} style={{height: '50px'}}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>         
            <button onClick={takeSnapshot} disabled={!isDroneConnected} style={{height: '50px'}}>Take a Snapshot</button>
            <button onClick={toggleDataCollection} disabled={!isDroneConnected} style={{height: '50px'}}>
              {isCollecting ? 'Stop Collecting Data' : 'Start Collecting Data'}
            </button>
            <button onClick={toggleTakeoffLand} disabled={!isDroneConnected} style={{height: '50px'}}>Take Off / Land</button>
            <button onClick={changeCameraDirection} disabled={!isDroneConnected} style={{height: '50px'}}>Change Camera Direction</button>
            <button onClick={toggleGraph} disabled={!isDroneConnected} style={{height: '50px'}}>{showGraph ? 'Hide Data Graph' : 'Show Data Graph'}</button>
            {showGraph && <GraphPopup data={collectedData} toggleGraph={toggleGraph} />}
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <button onClick={enableMissionPad} disabled={!isDroneConnected} style={{height: '50px'}}>Enable Mission Pad</button>
              <button onClick={getMissionPadData} disabled={!isDroneConnected} style={{height: '50px'}}>Mission Pad Data</button>
              <button onClick={navigateToMissionPad} disabled={!isDroneConnected} style={{height: '50px'}}>Navigate to Mission Pad</button>
            </div>
            {missionPadData.id !== null && (
              <div>
                <h3>Mission Pad Data:</h3>
                <p>ID: {missionPadData.id}</p>
                <p>X Distance: {missionPadData.x} cm</p>
                <p>Y Distance: {missionPadData.y} cm</p>
                <p>Z Distance: {missionPadData.z} cm</p>
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'center', textAlign: 'center'}}>
              <h3 style={{fontFamily: 'monospace', whiteSpace: 'pre' }}>
                &nbsp;&nbsp;&nbsp;W - Move Tello Up                    Arrow Up    - Move Tello Forward<br />
                &nbsp;&nbsp;&nbsp;&nbsp;S - Move Tello Down                  Arrow Down  - Move Tello Backward<br />
                A - Rotate Tello Counter-Clockwise   Arrow Left  - Move Tello Left<br />
                &nbsp;D - Rotate Tello Clockwise           Arrow Right - Move Tello Right<br />
              </h3>
            </div>
          
          </div>
        );
  }
    
    export default Drone;

