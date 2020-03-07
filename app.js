const { App } = require("@slack/bolt");

const request = require("request");

const {
    dogsays, 
    catsays,
    greetings,
    goodMornings,
    goodAfternoons,
    goodnights,
    goodbyes,
    affirmations,
    triggers
} = require("./messages");

function chooseRandom(list) {
    const index = Math.floor(Math.random() * Math.floor(list.length));
    return list[index];
}

function buildSalutationRegex(salutations) {
    return `^(${salutations.map((salutation) => `${salutation}!*`).join('|')})$`;
}

function buildSalutationMentionRegex(salutations) {
    return `(${salutations.map((salutation) => `${salutation}`).join('|')})`;
}

const salutationGroups = [
    greetings,
    goodMornings,
    goodAfternoons,
    goodnights,
    goodbyes
];

const greetingRegex =
    new RegExp(buildSalutationRegex(greetings), 'i');

const goodMorningRegex =
    new RegExp(buildSalutationRegex(goodMornings), 'i');

const goodAfternoonRegex =
    new RegExp(buildSalutationRegex(goodAfternoons), 'i');

const goodnightRegex =
    new RegExp(buildSalutationRegex(goodnights), 'i');

const goodbyeRegex =
    new RegExp(buildSalutationRegex(goodbyes), 'i');

const triggerRegex =
    new RegExp(`(${triggers.join('|')})`, 'i');

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

function buildSalutation(salutations, user) {
    let salutation = chooseRandom(salutations);
    salutation = salutation.charAt(0).toUpperCase() + salutation.slice(1);
    return `${salutation} <@${user}>!`;
}

app.message(greetingRegex, ({ message, say }) => {
    say(buildSalutation(greetings, message.user));
});

app.message(goodMorningRegex, ({ message, say }) => {
    say(buildSalutation(goodMornings, message.user));
});

app.message(goodAfternoonRegex, ({ message, say }) => {
    say(buildSalutation(goodAfternoons, message.user));
});

app.message(goodnightRegex, ({ message, say }) => {
    say(buildSalutation(goodnights, message.user));
});

app.message(goodbyeRegex, ({ message, say }) => {
    say(buildSalutation(goodbyes, message.user));
});

app.event('app_mention', ({payload, say}) => {
    const affirmation = chooseRandom(affirmations);

    for (const salutations of salutationGroups) {
        const regex = buildSalutationMentionRegex(salutations);
        const match = payload.text.match(regex);

        if (match) {
            const salutation = buildSalutation(salutations, payload.user);
            say(`${salutation}\n${affirmation}`);
            return;
        }
    }
    say(affirmation);
});

// Alerts moderators if a 'trigger' string was typed into a conversation
app.message(triggerRegex, async ({message, context}) => {
    try {
        const url = `https://pleasepassthelove-dsm.slack.com/archives/${message.channel}/p${message.ts.split('.').join('')}`;

        await app.client.chat.postMessage({
            token: context.botToken,
            channel: 'moderation', // channel ID: GV0JAQE05
            text: `<!channel> - <@${message.user}> posted a <${url}|trigger> in <#${message.channel}>`
        });
    } catch (error) {
        console.error(error);
    }
});

// Autojoin newly created conversations
app.event('channel_created', ({ event }) => {  
    const channel = event.channel;
    app.client.conversations.join({
        token: app.token,
        channel: channel.id
    });
});

// Displays random image of dog when 'dog' is typed in a conversation
app.message(/dog/i, async ({say}) => {
    const url = "https://dog.ceo/api/breeds/image/random";
    request.get(url, async function(err, response) {
        const dog = JSON.parse(response.body);
        const message = {
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
app.message(/cat/i, async ({say}) => {
    const url = "https://api.thecatapi.com/v1/images/search?size=full";
    request.get(url, async function(err, response) {
        const cat = JSON.parse(response.body);
        const message = {
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
