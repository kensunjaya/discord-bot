import React from 'react';
// import './App.css';
import Navbar from "./components/navbar"
import { useEffect, useState } from "react";

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

function App() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const fetchGuilds = async () => {
    console.log("Fetching Guilds")
    try {
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
        setGuilds(item);
        console.log(`Guilds : ${item}`);

    } catch (error: any) {
        console.error('Error fetching Guilds:', error.message);
    }
  }

  const fetchBotProfile = async () => {
    console.log("Fetching Guilds")
    try {
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
        setProfile(item);
        console.log(`Bot : ${item.id}`);

    } catch (error: any) {
        console.error('Error fetching Bot Profile:', error.message);
    }
  }

  useEffect(() => {
    fetchGuilds();
    fetchBotProfile();
  },[])

  return (
    <main className="bg-background min-h-screen w-screen">
      
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;1,300&display=swap" rel="stylesheet"/>
      <div className="flex">
        <Navbar client={profile}/>
        <div>
          <div className="m-4">
            <div className="text-lg text-black font-semibold">Server Joined : {guilds.length}</div>
          </div>
          <div className="flex flex-wrap">
            {guilds.map((guild) => (
              <div className="text-black bg-bluesa p-4 ml-4 my-2 rounded-xl">
                <div className="pb-1 font-semibold">{guild.guild_name}</div>
                <div style={{paddingBottom : "0.1rem", paddingTop : "0.2rem"}}>{guild.join_date}</div>
                <div style={{paddingBottom : "0.5rem"}}>Member count : {guild.guild_members_count}</div>
                <img src={guild.guild_icon} alt="Guild Icon" style={{width: "10rem", height: "10rem"}}/>
              </div>
            ))}
            
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
