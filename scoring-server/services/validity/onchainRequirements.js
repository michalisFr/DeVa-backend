const path = require('path');
const { initApi } = require('../../../utils/initApi');
const { 
    POLKADOT_MIN_BOND, 
    POLKADOT_DECIMALS, 
    KUSAMA_MIN_BOND, 
    KUSAMA_DECIMALS, 
    POLKADOT_MAX_COMMISSION,
    KUSAMA_MAX_COMMISSION
} = require('../../../utils/constants');
const { getOnchainValidatorData } = require('../../../utils/onchainValidatorData');

function _checkValidationIntention(onchainValidatorData) {
    const hasValidationIntention = onchainValidatorData.nextSessionKeys ? true : false;
    return hasValidationIntention;
}

function _checkMinimumBonded(network, onchainValidatorData) {
    let minBond;
    let decimals;

    if (network == 'polkadot') {
        minBond = POLKADOT_MIN_BOND;
        decimals = POLKADOT_DECIMALS;
    } else if (network == 'kusama') {
        minBond = KUSAMA_MIN_BOND;
        decimals = KUSAMA_DECIMALS;
    } 

    const hasMinimumBonded = onchainValidatorData.bonded / 10**decimals >= minBond ? true : false;

    return hasMinimumBonded;
}

function _checkIdentity(onchainValidatorData) {
    return onchainValidatorData.identity.hasIdentity;
}

function _checkCommission(network, onchainValidatorData) {
    let maxCommission;

    if (network == 'polkadot') {
        maxCommission = POLKADOT_MAX_COMMISSION;
    } else if (network == 'kusama') {
        maxCommission = KUSAMA_MAX_COMMISSION;
    } 

    const hasUpToMaxCommission = onchainValidatorData.commission <= maxCommission ? true : false;

    return hasUpToMaxCommission;
}

async function checkOnchainRequirements(api, network, account) {
    const onchainValidatorData = await getOnchainValidatorData(api, account);

    console.log(onchainValidatorData);

    const hasValidationIntention = _checkValidationIntention(onchainValidatorData);
    const hasMinimumBonded = _checkMinimumBonded(network, onchainValidatorData);
    const hasIdentity = _checkIdentity(onchainValidatorData);
    const hasUpToMaxCommission = _checkCommission(network, onchainValidatorData);
    
    return {
        hasValidationIntention,
        hasMinimumBonded,
        hasIdentity,
        hasUpToMaxCommission,
        "errors": onchainValidatorData.errors
    };
}

module.exports = {
    checkOnchainRequirements
}

async function main() {
    const account1 = "129pBPe7kDfuJjdwNHYaT1a8K65fVR5RWjog8xmVYmoQp4zz";
    const account2 = "14id3ENXVkJ34Q51AfWDGcMHA1EbGu8obF8QJLEUkzAB8KVh";
    const account3 = "1jh9R9jbVVttPgzwrci5GWqBT7ZTmePR7k3zHMUbXaTaKVE";
    const result = await initApi('polkadot');
    let api;

    if (result.success) {
        api = result.data;
    } else {
        console.log(result);
        return;
    }

    console.log(await checkOnchainRequirements(api, 'polkadot', account1));
    
}

main().then(process.exit);