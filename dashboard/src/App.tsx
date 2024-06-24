import React from 'react';
// import './App.css';
import Navbar from "./components/navbar"
import { useEffect, useState } from "react";
import { ScaleLoader } from 'react-spinners'
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Home from './pages/home';
import Messages from './pages/messages';

const App = () => {
  return (
    <main className="bg-background min-h-screen w-screen font-sans">
      
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </Router>
    </main>
  );
}

export default App;
