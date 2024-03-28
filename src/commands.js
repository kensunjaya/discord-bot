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
    }
]

module.exports = { interactionCommands }