import { useContext, useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { DataContext } from "../context/DataContext";
import { io } from "socket.io-client";
import Markdown from "../components/Markdown";
import { ScaleLoader } from "react-spinners";

const Messages = () => {
  const bot = useContext(DataContext);
  const [messages, setMessages] = useState();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/messages");
        const data = await response.json();
        bot?.setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    const socket = io("http://localhost:3030", {
      withCredentials: true
    });

    socket.on("message", (msg) => {
      console.log(msg);
      bot?.setMessages(msg);
      setMessages(msg.content);
    });

    return () => {
      socket.off("message");
      socket.close();
    };
  }, [bot?.setMessages]);
  
  return (
    <div className="bg-background min-h-screen w-screen font-sans">
      <div className="flex">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-black">
            <ScaleLoader loading={loading} color="white" margin={5} height={35}/>
          </div>
        )}
        <Navbar active="messages" />
        <div className="p-5 ml-64 text-sm w-full">
          {bot?.messages?.map((msg: any, index: number) => (
            <div key={index} className="bg-secondary p-2 rounded-lg mb-2 flex flex-col border border-third w-fit">
              <div className="text-txt text-xs">{msg.author} ・ {msg.timestamp}</div>
              {msg.contentType === 'text' ? <div className="text-white my-1"><Markdown markdown={msg.content} /></div> 
              : (msg.contentType === 'image' ? <a href={msg.content} target="_blank" className="text-xl text-purple-400"><img src={msg.content} alt={msg.alt} className="my-3 rounded-lg max-w-[40rem]"/></a>
              : <div className="my-1 text-yellow-300"><Markdown markdown={msg.content} /></div>)}

              <div className="text-txt text-xs">{msg.guild} ・ {msg.channel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default Messages;