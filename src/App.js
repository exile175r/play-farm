import React from 'react';
import farmDataJson from './data.json';
import Home from './components/Home';
import './App.css';

function App() {

  // const [farmData, setFarmData] = useState([]);

  // useEffect(() => {
  //   setFarmData(farmDataJson);
  // }, []);

  console.log(farmDataJson);

  return (
    <div className="App">
      <Home farmData={farmDataJson} />
    </div>
  );
}

export default App;
