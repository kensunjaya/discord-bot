import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";

const Navbar = () => {
  const bot = useContext(DataContext);
  const navigate = useNavigate();
  
  const handleClick = (route: string) => {
    navigate(route);
  }

  useEffect(() => {
    console.log("Bot Profile: ", bot?.botProfile);
  }, [])

  return (
    <nav className="bg-secondary min-h-screen pt-10 border-r border-third w-fit">
      <div className="flex flex-col items-center text-center p-5 whitespace-nowrap">
        <img src={bot?.botProfile?.avatar} alt="Bot Icon" className="mx-auto mb-5"/>
        <h2 className="text-white font-semibold text-xl">{bot?.botProfile?.username}</h2>
        <div className='text-white'>{`Tagline: ${bot?.botProfile?.tag}`}</div>
        <div className='text-white'>{`Created: ${bot?.botProfile?.dateCreated}`}</div>
        <div className='text-white'>{`ID: ${bot?.botProfile?.id}`}</div>
        <div className='text-white'>{`Status: ${bot?.botProfile?.online ? "Online" : "Offline"}`}</div>
      </div>
      <button onClick={() => handleClick("/")} className="bg-transparent mt-5 rounded-none w-full border-y-third">Dashboard</button>
      <button onClick={() => handleClick("/messages")} className="bg-transparent rounded-none w-full border-b-third">Messages</button>
      <button className="bg-transparent rounded-none w-full border-b-third">Active Players</button>
    </nav>
  );
}

export default Navbar;