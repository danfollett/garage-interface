import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import VehicleView from './pages/VehicleView';
import AddVehicle from './pages/AddVehicle';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicle/:id" element={<VehicleView />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/edit-vehicle/:id" element={<AddVehicle />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;