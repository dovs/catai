import {jsonModelSettings} from './model-settings.js';
import {SELECTED_BINDING} from './config.js';
import AlpacaCPPClient from './alpaca-client/alpaca-cpp/alpaca-cpp-client.js';
import NodeLlama from './alpaca-client/node-llama/node-llama.js';

const IS_ALPACA_CPP = SELECTED_BINDING === 'alpaca-cpp';
if(IS_ALPACA_CPP && !jsonModelSettings.exec || !jsonModelSettings.model) {
    throw new Error('Model not found, try re-downloading the model');
}

const selectedBinding = IS_ALPACA_CPP ? AlpacaCPPClient : NodeLlama;
/**
 *
 * @param socket {Awaited<ResponseType<import('tinyws')TinyWSRequest['ws']>>}
 * @return {Promise<void>}
 */
export async function activateChat(socket) {
    console.log("new connection");
    function sendJSON(type) {
        return (value = null) => socket.send(
            JSON.stringify({
                type,
                value
            })
        );
    }

    const chat =  new selectedBinding(sendJSON('token'), sendJSON('error'), sendJSON('end'));
    sendJSON('config-model')(SELECTED_BINDING);

    socket.on('message', async (message) => {
        const {question, abort} = JSON.parse(message);

        if(abort) {
            chat.abortSignal.abort();
        } else if(question){
            await chat.question(question);
        }
    });

    socket.on('close', () => {
        chat.close();
    });
}

export function requestAnswer(question, req) {
    return new Promise(async sendResponse => {

        let responseText = '';
        let responseError = '';

        let initEnded = false;
        const onEnd = () => {
            if(!initEnded) return;

            sendResponse({
                text: selectedBinding.trimMessageEnd(responseText),
                error: responseError
            });
        }
    
        const chat =  new selectedBinding(text => responseText += text, error => responseError += error, onEnd);
        await chat.waitInit;
        initEnded = true;

        responseText = '';
        responseError = '';

        req.connection.once('close', () => chat.close()); // abort signal
        await chat.question(question);
    });
}