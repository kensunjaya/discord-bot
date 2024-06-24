import { createContext } from "react";

interface DataContextType {
  bot: boolean;
  setBotProfile: Function;
  setBotGuild: Function;
  botProfile: {
    id : string
    username : string
    tag : string
    dateCreated : string
    avatar : string
    online : boolean
  } | null;
  botGuild: any | null;
}


export const DataContext = createContext<DataContextType | null>(null);