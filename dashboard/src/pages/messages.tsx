import { useContext, useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { DataContext } from "../context/DataContext";
import { io } from "socket.io-client";
import Markdown from "../components/Markdown";

const Messages = () => {
  const bot = useContext(DataContext);
  const [messages, setMessages] = useState();
  useEffect(() => {
    const socket = io("http://localhost:3030", {
      withCredentials: true
    });

    socket.on("message", (msg) => {
      console.log(msg);
      bot?.setMessages(msg);
      setMessages(msg.content);
      console.log(bot?.messages)
    });

    // Cleanup on component unmount
    return () => {
      socket.off("message");
      socket.close();
    };
  }, [bot?.setMessages]);
  
  return (
    <div className="bg-background min-h-screen w-screen font-sans">
      <div className="flex">
        <Navbar active="messages" />
        <div className="p-5 ml-64 text-sm w-full">
          {bot?.messages?.map((msg: any, index: number) => (
            <div key={index} className="bg-secondary p-2 rounded-lg mb-2 flex flex-col border border-third w-fit">
              <div className="text-txt text-xs">{msg.author} - {msg.timestamp}</div>
              {msg.contentType === 'text' ? <div className="text-white my-1"><Markdown markdown={msg.content} /></div> 
              : (msg.contentType === 'image' ? <img src={msg.content} alt="Attachment" width={"30%"} height={"30%"} className="my-3 rounded-lg"/> 
              : <div className="my-1 text-yellow-300"><Markdown markdown={msg.content} /></div>)}

              <div className="text-txt text-xs">{msg.guild} - {msg.channel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default Messages;