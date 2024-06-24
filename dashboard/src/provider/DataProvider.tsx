import { useState, ReactNode } from "react";
import { DataContext } from "../context/DataContext";

// Define the props interface, including children
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [bot, setBot] = useState(true);
  const [botProfile, setBotProfile] = useState(null);
  const [botGuild, setBotGuild] = useState(null);

  return <DataContext.Provider value={{bot, botProfile, setBotProfile, botGuild, setBotGuild}}>{children}</DataContext.Provider>;
};