<h1 align="center">Discord Bot</h1>
A multifunctional discord bot. Currently in very early development stage

To use the bot, you'll need to install [Node.js v16.11.0](https://nodejs.org/en/download/) or higher.

Create .env file outside src folder and store your token there
```env
TOKEN = PASTEYOURTOKENHERE
DATABASE_URL="postgresql://[username]:[password]@localhost:[port]/[dbname]"
ADMIN_ROLE_ID = YOUR DISCORD ID
```

## Install all depedencies
```bash
npm i
npm install -g nodemon
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
npm run start
```
If you encounter "Error: Used disallowed intents":
<br>
<ul>1. Navigate to Discord Development Portal</ul>
<ul>2. On the left, select Bot</ul>
<ul>3. Scroll to bottom and find Privileged Gateway Intents</ul>
<ul>4. Enable all Intents</ul>

