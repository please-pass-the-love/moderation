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
    triggers,
    welcome
} = require("./messages");

const suggestionModal = require('./suggestionModal.json');

function getFirstProp(obj) {
    return obj[Object.keys(obj)[0]];
}

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

app.event('member_joined_channel', async ({payload}) => {
    // welcome message when joining #general
    if (payload.channel === 'CV05NN1V3') {
        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: payload.user,
            text: welcome
        });
    }
});

// Handles the slashcommand /suggestion to pop a modal for making suggestions to the private suggestions channel
app.command('/suggestion', async ({ ack, body }) => {
    ack();
    try {
        await app.client.views.open({
            token: process.env.SLACK_BOT_TOKEN,
            trigger_id: body.trigger_id,
            view: suggestionModal
        });
    }
    catch (error) {
        console.log(error);
    }
});

// Handles the 'Submit' postback when a user enter a suggestion and submits
app.view('suggestionbox', async ({ ack, body }) => {
    ack();
    try {
        const nameID = body['user']['id'];
        const suggestion = getFirstProp(getFirstProp(body['view']['state']['values']))['value'];
        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: 'suggestions',
            text: `<@${nameID}> posted a suggestion: ${suggestion}`
        });
    } catch (error) {
        console.log(error);
    }
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
    console.log(`hit trigger in ${message.text}`)
    try {
        const url = `https://pleasepassthelove-dsm.slack.com/archives/${message.channel}/p${message.ts.split('.').join('')}`;

        await app.client.chat.postMessage({
            token: context.botToken,
            channel: 'testing-public-channel', // channel ID: GV0JAQE05
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
        token: process.env.SLACK_BOT_TOKEN,
        channel: channel.id
    });
});

// Displays random image of dog when 'dog' is typed in a conversation
app.message(/dog/i, async ({say}) => {
    const url = "https://dog.ceo/api/breeds/image/random";
    request.get(url, async function(err, response) {
        const dog = JSON.parse(response.body);
        const message = {
            "text" : chooseRandom(dogsays),
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
            "text" : chooseRandom(catsays),
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
