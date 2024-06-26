import { useCallback, useContext, useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";
import Navbar from "../components/navbar";
import { DataContext } from "../context/DataContext";


interface Guild {
  guild_id: string
  guild_name: string
  // guild_members: Array<object>
  guild_members_count: number
  guild_icon: string
  join_date: string
}

interface Profile {
  bot_id : string
  bot_username : string
  bot_tag : string
  bot_creation_date : string
  bot_avatar : string
  online : boolean
}


const Home = () => {
  const bot = useContext(DataContext);
  
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const [loading, setLoading] = useState(false);

  const fetchGuilds = async () => {
    console.log("Fetching Guilds")
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/guilds", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Network response error : ${response.status}`);
      }
      const item = await response.json();
      bot?.setBotGuild(item);
      console.log(`Guilds : ${bot?.botGuild}`);
      setGuilds(item);
      // console.log(`Guilds : ${item}`);

    } catch (error: any) {
      console.error('Error fetching Guilds:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const fetchBotProfile = async () => {
    console.log("Fetching Guilds")
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/bot", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Network response error : ${response.status}`);
      }

      const item = await response.json();
      bot?.setBotProfile(item);
      setProfile(item);
      console.log(`Bot : ${bot?.botProfile}`);

    } catch (error: any) {
      console.error('Error fetching Bot Profile:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGuilds()
    .then(fetchBotProfile);
    
  },[])

  return (
    <main className="bg-background min-h-screen w-screen font-sans flex flex-col">
      
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-black">
          <ScaleLoader loading={loading} color="white" margin={5} height={35}/>
        </div>
      )}
      <div className="flex flex-grow">
        <Navbar active="home"/>
        <div className="ml-64">
          <div className="m-5">
            <div className="text-lg text-txt font-semibold">Server Joined : {guilds.length}</div>
          </div>
          <div className="flex flex-wrap">
            {bot?.botGuild?.map((guild: any, index: number) => (
              <button key={index} className="text-txt bg-secondary p-4 ml-6 my-3 rounded-xl border border-third hover:opacity-75">
                <div className="pb-1 text-lg font-semibold">{guild.guild_name}</div>
                <div className="pb-1">{guild.join_date}</div>
                <div className="pb-2">Member count : {guild.guild_members_count}</div>
                <img src={guild.guild_icon} alt="Guild Icon" className="w-[12rem] h-[12rem] rounded-md"/>
              </button>
            ))}
            
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;