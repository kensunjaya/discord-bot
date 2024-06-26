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
})

app.get('/posts/:id', (req, res) => {
  // Get the id parameter from the request
  const id = req.params.id;

  // Find the post with the given id in the posts array
  const post = posts.find((p) => p.id == id);

  // If the post exists, send it as a JSON response
  if (post) {
    res.json(post);
  } else {
    // If the post does not exist, send a 404 status code and a message
    res.status(404).send('Post not found');
  }
});

app.post('/posts', (req, res) => {
  // To handle the request body, we need to use a middleware called express.json
  // This middleware parses the request body as JSON and adds it to the req object
  app.use(express.json());

  // Get the data from the request body
  const data = req.body;

  // Validate the data
  if (data.title && data.content && data.author) {
    // If the data is valid, create a new post object with a new id
    const newId = posts.length + 1;
    const newPost = new Post(newId, data.title, data.content, data.author);

    // Add the new post to the posts array
    posts.push(newPost);

    // Send a 201 status code and the new post as a JSON response
    res.status(201).json(newPost);
  } else {
    // If the data is invalid, send a 400 status code and a message
    res.status(400).send('Invalid data');
  }
});


app.put('/posts/:id', (req, res) => {
  // Get the id parameter from the request
  const id = req.params.id;

  // Get the data from the request body
  const data = req.body;

  // Validate the data
  if (data.title && data.content && data.author) {
    // If the data is valid, find the post with the given id in the posts array
    const post = posts.find((p) => p.id == id);

    // If the post exists, update its properties with the data
    if (post) {
      post.title = data.title;
      post.content = data.content;
      post.author = data.author;
      res.status(200).json(post);
    } else {
      res.status(404).send('Post not found');
    }
  } else {
    // If the data is invalid, send a 400 status code and a message
    res.status(400).send('Invalid data');
  }
});