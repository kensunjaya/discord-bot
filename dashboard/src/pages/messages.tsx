import { useContext } from "react";
import Navbar from "../components/navbar";
import { DataContext } from "../context/DataContext";

const Messages = () => {
  const bot = useContext(DataContext);
  return (
    <div className="bg-background min-h-screen w-screen font-sans">
      <div className="flex">
        <Navbar />
      </div>
    </div>
  )
}
export default Messages;