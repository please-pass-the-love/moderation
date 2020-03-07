const { App } = require("@slack/bolt");
const { affirmations, triggers, dogsays, catsays } = require("./messages");

const request = require("request");

const triggerRegex = new RegExp(`(${triggers.join('|')})`, 'i');

function randomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const app = new App({
    token: 'xoxb-974706494115-975281028755-mU7qCAaTv51l8pzhIBU6xhIH',
    signingSecret: '819d3a0ea7d164efd0f024efb3f8d2ea'
});

app.message(/^(hi|hello|hey)$/i, ({ message, say }) => {
    say(`Hola <@${message.user}>!`);
});

app.message(/^sunshine/i, ({say}) => {
    const affirmation = affirmations[randomInt(affirmations.length)]
    say(affirmation);
});

// Alerts moderators if a 'trigger' string was typed into a conversation
app.message(triggerRegex, async ({message, context}) => {
    try {
        await app.client.chat.postMessage({
            token: context.botToken,
            channel: 'GV0JAQE05',
            text: `<@${message.user}> posted a trigger in ${message.channel}: ${message.text}`
        });
    } catch (error) {
        console.error(error);
    }
});

// Autojoin newly created conversations
app.event('channel_created', ({ event, say }) => {  
    var channel = event.channel;
    app.client.conversations.join({
        token: app.token,
        channel: channel.id
    });
});

// Displays random image of dog when 'dog' is typed in a conversation
app.message(/dog/i, async ({message, context, say}) => {
    var url = "https://dog.ceo/api/breeds/image/random";
	request.get(url, async function(err, response) {
        const dog = JSON.parse(response.body);
		var message = {
            "text" : dogsays[randomInt(dogsays.length)],
            "attachments": [
                {
                    "fallback": "Cute doggo",
                    "image_url": dog.message,
                }
            ]
        };
        try {
            say(message);
        } catch (error) {
            console.error(error);
        }
    });
});


// Displays random image of cat when 'cat' is typed in a conversation
app.message(/cat/i, async ({message, context, say}) => {
    var url = "https://api.thecatapi.com/v1/images/search?size=full";
    request.get(url, async function(err, response) {
        var cat = JSON.parse(response.body);
        var message = {
            "text" : catsays[randomInt(catsays.length)],
            "attachments": [
                {
                    "fallback": "Cute kitten",
                    "image_url": cat[0].url
                }
            ]
        };
        try {
            say(message);
        } catch (error) {
            console.error(error);
        }
    });
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Slack moderation app is running!');
})();
