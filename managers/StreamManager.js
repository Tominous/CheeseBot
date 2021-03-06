const streammanager = {};

const Twitch = require('twitch').default;

const clientId = process.env.TWITCH_ID;
const clientSecret = process.env.TWITCH_SECRET;
const twitchClient = Twitch.withClientCredentials(clientId, clientSecret);

const WebHookListener = require('twitch-webhooks').default;

let listener;
let subscriptions = [];

streammanager.load = async function (client) {
    listener = await WebHookListener.create(twitchClient, {port: 8090});
    listener.listen();
    const botConstants = require("../utils/Constants.js").getBotConstants();
    for (let x of botConstants.twitchSubscriptions) {
        subscriptions.push(await listener.subscribeToStreamChanges(x, async (stream) => {
            if (stream) {
                let game = "";
                stream.getGame().then((twitchGame) => {
                    game = twitchGame.name;
                    client.guilds.get(botConstants.guildId).channels.get(botConstants.livestreamChannel).send("<@&" + botConstants.livestreamRole + "> " + stream.userDisplayName + " has just gone live with " + game + ": `" + stream.title + "`! Join at https://twitch.tv/" + stream.userDisplayName + " !");
                });
            }
        }));
    }
};

streammanager.end = function() {
    for (let x of subscriptions) {
        x.stop();
    }
};

module.exports = streammanager;