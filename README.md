<h1 align="center">Discord Bot</h1>
A multifunctional discord bot. Currently in very early development stage

To use the bot, you'll need to install [Node.js v16.11.0](https://nodejs.org/en/download/) or higher.

Create .env file outside src folder and store your token there
```
TOKEN = PASTEYOURTOKENHERE
DATABASE_URL="postgresql://[username]:[password]@localhost:[port]/[dbname]"
ADMIN_ROLE_ID = YOUR DISCORD ID
```

Before running the bot, make sure to install all depedencies by typing the following command:
```bash
npm i
npm install -g nodemon
```

The following command is used to run the bot
```bash
nodemon
```
Alternatively, run `run.bat` if you're on windows
<br><br>
If you encounter "Error: Used disallowed intents":
<br>
`Navigate to Discord Development Portal`
<br>
`On the left, select Bot`
<br>
`Scroll to bottom and find Privileged Gateway Intents`
<br>
`Enable all Intents`
