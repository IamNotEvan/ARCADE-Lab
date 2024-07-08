import React from 'react';

const HuskyControl = () => {
    const sendCommand = (command) => {
        // Base URL for the Flask server
        const baseUrl = 'http://localhost:5000';

        // Determine the correct endpoint based on the command
        let endpoint = '';
        switch (command) {
            case 'forward':
                endpoint = `${baseUrl}/husky/move_forward`;
                break;
            case 'backward':
                endpoint = `${baseUrl}/husky/move_backward`;
                break;
            case 'left':
                endpoint = `${baseUrl}/husky/turn_left`;
                break;
            case 'right':
                endpoint = `${baseUrl}/husky/turn_right`;
                break;
            case 'stop':
                endpoint = `${baseUrl}/husky/stop`;
                break;
            default:
                console.log('Invalid command');
                return;
        }

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
    };

    return (
        <div>
            <h1 style={{align: 'center', position: 'absolute',bottom: 265, right: 300}}>Husky UGV Controller</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute',bottom: 15, right: 200}}>
                <button onClick={() => sendCommand('forward')} style={{ marginBottom: '10px', width: '150px', height: '75px'}}>↑ Forward</button>
                <div>
                    <button onClick={() => sendCommand('left')} style={{ marginRight: '10px', width: '150px', height: '75px' }}>← Left</button>
                    <button onClick={() => sendCommand('stop')} style={{ margin: '10px', backgroundColor: '#F40009', width: '150px', height: '75px'}}>■ Stop</button>
                    <button onClick={() => sendCommand('right')} style={{ marginLeft: '10px', width: '150px', height: '75px'}}>Right →</button>
                </div>
                <button onClick={() => sendCommand('backward')} style={{ marginTop: '10px', width: '150px', height: '75px'}}>↓ Backward</button>
            </div>
        </div>
    );
};

export default HuskyControl;
