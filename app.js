const { App } = require("@slack/bolt");
const { affirmations, triggers } = require("./messages");

const triggerRegex = new RegExp(`(${triggers.join('|')})`, 'i');

function randomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.message(/^(hi|hello|hey)$/i, ({ message, say }) => {
    say(`Hello <@${message.user}>!`);
});

app.message('sunshine', ({say}) => {
    const affirmation = affirmations[randomInt(affirmations.length)]
    say(affirmation);
});

app.message(triggerRegex, async ({message, context}) => {
    try {
        const url = `https://pleasepassthelove-dsm.slack.com/archives/${message.channel}/p${message.ts.split('.').join('')}`;

        await app.client.chat.postMessage({
            token: context.botToken,
            channel: 'GV0JAQE05',
            text: `<@channel> - <@${message.user}> posted a <${url}|trigger> in <#${message.channel}>`
        });
    } catch (error) {
        console.error(error);
    }
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('Slack moderation app is running!');
})();
