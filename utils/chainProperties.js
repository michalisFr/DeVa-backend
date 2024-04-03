const path = require('path');
const { initApi } = require('./initApi');

async function getChainProperties(api) {
    try {
        const properties = (await api.rpc.system.properties()).toHuman();
        
        const decimals = Number(properties.tokenDecimals[0]);
        const symbol = properties.tokenSymbol[0];
        
        return {
            "success": true,
            "module": path.join(__filename),
            "data": {
                decimals,
                symbol
            }
        }
    } catch(err) {
        return {
            "success": false,
            "module": path.join(__filename),
            "error": `Unable to get chain properties. Error: ${err}`
        }
    }
}

module.exports = {
    getChainProperties
}

