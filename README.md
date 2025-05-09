<h1 align="center">Discord Bot</h1>
A multifunctional discord bot. Currently in very early development stage

To use the bot, you'll need to install [Node.js v16.11.0](https://nodejs.org/en/download/) or higher.

Create .env file outside src folder and store your token there
```env
TOKEN = // Your bot token here
MONGO_URI = // Your mongodb uri
ADMIN_ROLE_ID = // Your Discord id
INTRO_URL = // YouTube url for on voice channel join intro
```

## Install all depedencies
```bash
npm install
```

The following command is used to run the bot
```bash
nodemon server/server.mjs
```
Alternatively, run `run.bat` if you're on windows
<br><br>

The following command is used to run dashboard webserver
```bash
cd dashboard
npm install
npm run dev
```
The `npm install` command is necessary when running the bot and the dashboard for the first time

## Additional Note
<p>If you're running on ARM64 Linux, you'll need to install the following library</p>

```bash
npm install mediaplex-linux-arm64-gnu
```

If you encounter "Error: Used disallowed intents":
<br>
<ul>1. Navigate to Discord Development Portal</ul>
<ul>2. On the left, select Bot</ul>
<ul>3. Scroll to bottom and find Privileged Gateway Intents</ul>
<ul>4. Enable all Intents</ul>

## Libraries & Frameworks used:
<br />
<img src="https://discord.js.org/static/logo.svg" alt="discord js logo" width=40% height=40% />
<img src="https://nodejs.org/static/logos/nodejsLight.svg" alt="NodeJS logo" width=40% height=40% />
<img src="https://miro.medium.com/v2/resize:fit:800/0*CBjisl422hUyLxiG.png" alt="React logo" width="40%" height="40%"/>
<img src="assets/MongoDB_SpringGreen.png" alt="Mongo logo" width="40%" height="40%"/>
