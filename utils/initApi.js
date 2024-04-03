const path = require('path');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { KUSAMA_RPC_PROVIDERS, POLKADOT_RPC_PROVIDERS } = require('./constants');

async function initApi(network) {
    let rpcProvidersList = [];
    let api;
    const connectionErrors = [];

    if (network == "kusama") {
        rpcProvidersList = KUSAMA_RPC_PROVIDERS;
    } else if (network == "polkadot") {
        rpcProvidersList = POLKADOT_RPC_PROVIDERS;
    } else {
        return {
            "success": false,
            "module": path.join(__filename),
            "error": "Unknown network provided"
        };
    }
    
    for (let provider of rpcProvidersList) {
        try {
            const wsProvider = new WsProvider(provider);
            api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

            if (wsProvider.isConnected && api.isConnected) {
                break;
            }
        } catch(err) {
            connectionErrors.push({
                "provider": provider,
                "error": err
            });

            // Check if we've run out of providers
            if (rpcProvidersList.indexOf(provider) == rpcProvidersList.length - 1) {
                return {
                    "success": false,
                    "module": path.join(__filename),
                    "error": `Unable to connect to any RPC provider. Errors: ${connectionErrors}`
                }
            }
        }
    }

    return {
        "success": true,
        "module": path.join(__filename),
        "data": api
    };
}

module.exports = {
    initApi
}