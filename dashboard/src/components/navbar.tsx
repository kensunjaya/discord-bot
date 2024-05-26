import React from 'react';

function Navbar({client}: {client: any}) {
  console.log(client?.avatar);
  return (
    <nav style={{
      position: 'relative', // or 'absolute' if you want it relative to a parent container
      top: 0,
      left: 0,
      bottom: 0,
      width: '9%', 
      height: '100vh',
      backgroundColor: '#3D52A0',
      padding: '1rem',
      paddingTop: '2rem',
      display: 'flex',
      flexDirection: 'column',
      justifyItems : "center",
      fontFamily: "Open Sans, sans-serif",
      alignItems: 'center',
    }}>
      <div style={{ textAlign: 'center', color : 'rgb(255, 255, 255)'}}>
        <img src={client?.avatar} alt="Bot Icon" style={{ width: "10rem", height: "10rem"}}/>
        <h2 className="text-white">{client?.username}</h2>
        <div className='text-red'>{`Tagline: ${client?.tag}`}</div>
        <div className='text-white'>{`Created: ${client?.dateCreated}`}</div>
        <div className='text-white'>{`ID: ${client?.id}`}</div>
        <div className='text-white'>{`Status: ${client?.online ? "Online" : "Offline"}`}</div>
      </div>
    </nav>
  );
}

export default Navbar;