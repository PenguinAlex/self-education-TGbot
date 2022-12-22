require('dotenv').config()
const {TELEGRAM_API_TOKEN} = process.env
const directionsData = require('./data/directions.json');

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TELEGRAM_API_TOKEN, {polling: true});

const {directions: directionsKeyboard} = require('./keyboards/directions');
bot.on('message', (msg) => {
    const {text, chat: {id: chatID}} = msg;
    if (text !== "/start") return;

    bot.sendMessage(chatID, "Выберите направление:", {
        reply_markup: {
            inline_keyboard: directionsKeyboard,
        }
    })
});

bot.on('callback_query', (data) => {
        const {data: payload, message: {chat: {id: chatID}, message_id}} = data;
        if (payload === 'back') {
            bot.sendMessage(chatID, "Выберите направление:", {
                reply_markup: {
                    inline_keyboard: directionsKeyboard,
                }
            })
            return;
        }
        const type = payload.includes("books") || payload.includes("movies") ? "getInfo" : "getChoose"

        bot.deleteMessage(chatID, message_id)
        switch (type) {
            case "getInfo":
                const directionName = payload.split("/")[0];
                const choose = payload.split("/")[1];
                const responseString = mapDirectionToText(directionsData[directionName], choose);
                bot.sendMessage(chatID, responseString, {
                    parse_mode: "MarkdownV2",
                    reply_markup: {
                        inline_keyboard: [[{
                            text: 'Вернуться к направлениям',
                            callback_data: 'back'
                        }]]
                    }
                })
                break;
            case
            "getChoose":
                bot.sendMessage(chatID, "Выберите направление:", {
                    reply_markup: {
                        inline_keyboard: getChooseKeyboard(payload),
                    }
                })
                break;
        }
    }
)

function getChooseKeyboard(directionName) {
    return [
        [
            {
                text: 'Фильмы',
                callback_data: `${directionName}/movies`
            }
        ],
        [
            {
                text: 'Книги',
                callback_data: `${directionName}/books`
            }
        ]
    ]
}

function mapDirectionToText(data, type) {
    const {books, movies} = data;
    let resultString;
    switch (type) {
        case "movies":
            resultString = "*_Фильмы_*" + movies.map(({name, description}) => {
                return `\n  *${name}*\n     _${description}_`
            }).join();
            break
        case "books":
            resultString = "*_Книги_*" + books.map(({name, description}) => {
                return `\n  *${name}*\n     _${description}_`
            }).join();
            break;
        default:
            resultString = "Подумай ещё раз"
    }

    return resultString;
}

