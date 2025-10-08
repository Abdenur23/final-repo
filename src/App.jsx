import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Product1Page from './pages/Product1Page';
import Product2Page from './pages/Product2Page';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product1" element={<Product1Page />} />
          <Route path="/product2" element={<Product2Page />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
