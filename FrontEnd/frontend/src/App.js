// App.js
import React from 'react';
import './App.css';
import Drone from './Drone'; // Adjust the path as necessary
import Husky from './Husky';


function App() {
  return (
    <div className="App" style={{display: 'flex'}}>
      <div style={{alignItems: 'center', flex: 1}}>
        <Drone/>
      </div>
      <div style={{alignItems: 'center', flex: 1}}>
        <div>
          
        </div>
        <div>
          <Husky/>
        </div>
      </div>
    </div>
    
  );
}

export default App;
