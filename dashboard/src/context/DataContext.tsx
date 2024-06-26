import { createContext } from "react";

interface DataContextType {
  bot: boolean;
  setBotProfile: Function;
  setBotGuild: Function;
  setMessages: Function;
  botProfile: {
    id : string
    username : string
    tag : string
    dateCreated : string
    avatar : string
    online : boolean
  } | null;
  botGuild: any | null;
  messages: any | null;
}


export const DataContext = createContext<DataContextType | null>(null);