const { QueryType } = require("discord-player");

interactionCommands = [
    {
        name: "play",
        description: "Plays a track",
        options: [
            {
                name: "query",
                type: 3,
                description: "The track you want to play",
                required: true
            },
            {
                name: "search_engine",
                type: 3,
                description: "Search engine to find your tracks, default is AUTO",
                required: false,
                choices: [
                    {
                        name: "YouTube",
                        value: QueryType.YOUTUBE
                    },
                    {
                        name: "Spotify",
                        value: QueryType.SPOTIFY_SONG
                    },
                    {
                        name: "SpotifyPlaylist",
                        value: QueryType.SPOTIFY_PLAYLIST
                    },
                    {
                        name: "SpotifyAlbum",
                        value: QueryType.SPOTIFY_ALBUM
                    },
                    {
                        name: "Soundcloud",
                        value: QueryType.SOUNDCLOUD
                    },
                ],
                default: QueryType.AUTO
            }
        ]
    },
    {
        name: "p",
        description: "Plays a track",
        options: [
            {
                name: "query",
                type: 3,
                description: "The track you want to play",
                required: true
            },
            {
                name: "search_engine",
                type: 3,
                description: "Search engine to find your tracks, default is AUTO",
                required: false,
                choices: [
                    {
                        name: "Spotify",
                        value: QueryType.SPOTIFY_SEARCH
                    },
                    {
                        name: "YouTube",
                        value: QueryType.YOUTUBE
                    },
                    {
                        name: "Soundcloud",
                        value: QueryType.SOUNDCLOUD
                    },
                ],
                default: QueryType.AUTO
            }
        ]
    },
    {
        name: "loop",
        description: "Set loop mode",
        options: [
            {
                name: "condition",
                type: 3,
                description: "Loop condition",
                required: true,
                choices : [
                    {
                        name: "on",
                        value: "on"
                    },
                    {
                        name: "off",
                        value: "off"
                    }
                ]
            }
        ]
    },
    {
        name: "skip",
        description: "Skip the current track"
    },
    {
        name: "stop",
        description: "Stop / disconnect the bot"
    },
    {
        name: "queue",
        description: "Show the queue list"
    },
    {
        name: "remove",
        description: "Remove a track from queue",
        options: [{
            name: "index",
            type: 4,
            description: "The index of track to remove",
            required: true
        }]
    },
    {
        name: "help",
        description: "Show available commands",
    },
    {
        name: "pause",
        description: "Pause current track",
    },
    {
        name: "resume",
        description: "Resume current track",
    },
    {
        name: "jump",
        description: "Jump to specific track",
        options: [{
            name: "index",
            type: 4,
            description: "The index of track to play",
            required: true
        }]
    },
    {
        name: "shuffle",
        description: "Shuffle tracks in queue"
    },
    {
        name: "info",
        description : "Display information about the bot"
    },
    {
        name: "ping",
        description : "Display network latency statistics"
    },
    {
        name: "lyrics",
        description : "Get lyrics of the current track"
    },
    {
        name: "ws",
        description: "Word scramble game",
        options: [
            {
                name: "condition",
                type: 3,
                description: "Game status",
                required: true,
                choices : [
                    {
                        name: "start",
                        value: "start"
                    },
                    {
                        name: "stop",
                        value: "stop"
                    }
                ]
            }
        ]
    }
]

module.exports = { interactionCommands }