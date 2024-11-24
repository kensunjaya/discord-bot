import express from 'express';
import cors from 'cors'
import { client, socketMessages } from '../src/index.js';

const app = express();

const port = 5000;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

app.use(express.json());
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(cors(corsOptions));


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});

// Define the data function for creating a blog post
function createPost(id, title, content, author) {
  return {
    id: id,
    title: title,
    content: content,
    author: author,
  };
}

const posts = [
  createPost(1, 'Hello World', 'This is my first blog post', 'Alice'),
  createPost(2, 'Express JS', 'This is a blog post about Express JS', 'Bob'),
  createPost(3, 'RESTful API', 'This is a blog post about RESTful API', 'Charlie'),
];

// Create a route and a handler for GET /posts
app.get('/posts', (req, res) => {
  // Send the posts array as a JSON response
  res.status(200).json(posts);
});

app.get('/guilds', async (req, res) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const guilds = client.guilds.cache.map(guild => {
    return {
        guild_id: guild.id,
        guild_name: guild.name,
        guild_members_count: guild.memberCount,
        guild_icon: guild.iconURL() ? guild.iconURL() : 'https://cdn.discordapp.com/embed/avatars/1.png',
        join_date: guild.joinedAt.toLocaleDateString('en-US', options)
    };
  });
  res.status(200).json(guilds);
})

app.get('/messages', async (req, res) => {
  res.json(socketMessages);
})

app.get('/bot', async (req, res) => {
  let bot_profile = null;
  if (client) {
    bot_profile = {
      id : client.user.id,
      username : client.user.username,
      tag : client.user.discriminator,
      dateCreated : new Date(client.user.createdTimestamp).toLocaleDateString("en-US"),
      avatar : client.user.avatarURL(),
      online : client.isReady()
    }
  }
  else {
    bot_profile = {
      id : null,
      username : null,
      tag : null,
      dateCreated : null,
      avatar : null,
      online : false
    }
  }

  res.status(200).json(bot_profile);
});