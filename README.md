# discord-bot
A multifunctional discord bot. Currently in very early development stage

To use the bot, create .env file outside src folder and store your token there
```js
TOKEN = PASTEYOURTOKENHERE
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

If you encounter "Error: Used disallowed intents":
<br>
`Navigate to Discord Development Portal`
<br>
`On the left, select Bot`
<br>
`Scroll to bottom and find Privileged Gateway Intents`
<br>
`Enable all Intents`
