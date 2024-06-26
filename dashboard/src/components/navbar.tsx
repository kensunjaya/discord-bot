import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";

const Navbar = ({active} : {active: string}) => {
  const bot = useContext(DataContext);
  const navigate = useNavigate();
  
  const handleClick = (route: string) => {
    navigate(route);
  }

  useEffect(() => {
    if (!bot?.botProfile) navigate("/");
    console.log("Bot Profile: ", bot?.botProfile);
  }, [])

  return (
    <nav className="bg-secondary min-h-screen pt-10 border-r border-third w-64 fixed">
      <div className="flex flex-col items-center text-center p-5 whitespace-nowrap text-txt">
        <img src={bot?.botProfile?.avatar} alt="Bot Icon" className="mb-5"/>
        <div className="font-semibold text-xl">{bot?.botProfile?.username}</div>
        <div>{`Tagline: ${bot?.botProfile?.tag}`}</div>
        <div>{`Created: ${bot?.botProfile?.dateCreated}`}</div>
        <div className="font-mono">{`ID: ${bot?.botProfile?.id}`}</div>
        <div className="flex">
          <div className="mr-2">Status:</div>
          {bot?.botProfile?.online ? <div className="text-green-500"> Online</div> : <div className="text-red-500"> Offline</div>}
        </div>
      </div>
      <button onClick={() => handleClick("/")} className={`${active === "home" ? "bg-third" : "bg-transparent"} mt-5 rounded-none w-full border-y-third`}>Dashboard</button>
      <button onClick={() => handleClick("/messages")} className={`${active === "messages" ? "bg-third" : "bg-transparent"} rounded-none w-full border-b-third`}>Messages</button>
      <button className={`${active === "player" ? "bg-third" : "bg-transparent"} rounded-none w-full border-b-third`}>Active Players</button>
    </nav>
  );
}

export default Navbar;