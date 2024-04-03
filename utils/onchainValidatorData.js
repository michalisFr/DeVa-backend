const path = require('path');
const { initApi } = require('./initApi');

async function _getController(api, account) {
    try {
        const controller = (await api.query.staking.bonded(account)).toHuman();

        return {
            "success": true,
            "data": controller
        };

    } catch(err) {
        return {
            "success": false,
            "error": err
        };
    }
}

async function _getLedger(api, controller) {
    try {
        const ledger = (await api.query.staking.ledger(controller)).toJSON();

        let active = null;
        let claimedRewards = null;

        if (ledger) {
            if (ledger?.active) {
                active = ledger.active;
            }
            if (ledger?.claimedRewards) {
                claimedRewards = ledger.claimedRewards;
            }
        }

        return {
            "success": true,
            "data": {
                active,
                claimedRewards
            }
        };
    } catch(err) {
        return {
            "success": false,
            "error": err
        };
    }
}

async function _getSessionKeys(api, account) {
    try {
        const nextSessionKeys = (await api.query.session.nextKeys(account)).toHuman();

        return {
            "success": true,
            "data": nextSessionKeys
        };
    } catch(err) {
        return {
            "success": false,
            "error": err
        };
    }
}

async function _getIdentity(api, account) {
    try {
        let identityOf = (await api.query.identity.identityOf(account)).toHuman();
        let subsOf = (await api.query.identity.subsOf(account)).toHuman();
        const superOf = (await api.query.identity.superOf(account)).toHuman();

        let identity = {
            "hasIdentity": false,
            "identityData": {},
            "judgementData": {},
            "isVerified": false,
            "isSubIdentity": null,
            "identityFamily": {
                "parentAccount": null,
                "subIdentities": []
            }            
        }

        if (!identityOf) {
            if (superOf) {
                identity.hasIdentity = true;
                identity.isSubIdentity = true;
                identity.identityFamily.parentAccount = superOf[0];
                identity.identityData["subIdentity"] = superOf[1]?.Raw || null;

                identityOf = (await api.query.identity.identityOf(superOf[0])).toHuman();
                subsOf = (await api.query.identity.subsOf(superOf[0])).toHuman();
            } 
        }

        if (identityOf) {
            identity.hasIdentity = true;
            identity.identityData["display"] = identityOf.info.display?.Raw;
            identity.identityData["riot"] = identityOf.info.riot?.Raw || null;
            identity.identityData["email"] = identityOf.info.email?.Raw || null;

            if (identityOf.judgements.length > 0) {
                identity.judgementData["registrar"] = identityOf.judgements[0][0]
                identity.judgementData["judgement"] = identityOf.judgements[0][1]
                identity.isVerified = true;
            }

            identity.identityFamily.subIdentities = subsOf[1].map((x) => x);

            if (!superOf) {
                identity.isSubIdentity = false;
                identity.identityFamily.parentAccount = account;
            }
        }
        return {
            "success": true,
            "data": identity
        };
    } catch(err) {
        return {
            "success": false,
            "error": err
        };
    }
}

async function _getValidatorPrefs(api, account) {
    try {
        const validatorPrefs = (await api.query.staking.validators(account)).toJSON();

        const commission = validatorPrefs.commission / 10**7;
        const blocked = validatorPrefs.blocked;
        
        return {
            "success": true,
            "data": {
                commission,
                blocked
            }
        };
    } catch(err) {
        return {
            "success": false,
            "error": err
        };
    }
}

async function getOnchainValidatorData(api, account) {
    const onchainValidatorData = {
        "controller": null,
        "bonded": null,
        "claimedRewards": null,
        "nextSessionKeys": null,
        "identity": null,
        "commission": null,
        "blockedNominations": null,
        "errors": []
    }

    const resController = await _getController(api, account);

    let resLedger;

    if (resController.success) {
        onchainValidatorData.controller = resController.data;

        resLedger = await _getLedger(api, resController.data);

        if (resLedger.success) {
            onchainValidatorData.bonded = resLedger.data.active;
            onchainValidatorData.claimedRewards = resLedger.data.claimedRewards;
        } else {
            onchainValidatorData.errors.push({
                "failedDataFetch": "Staking Ledger",
                "error": resLedger.error
            });
        }
        
    } else {
        onchainValidatorData.errors.push({
            "failedDataFetch": "Controller",
            "error": resController.error
        });
    }
    
    const resSessionKeys = await _getSessionKeys(api, account);

    if (resSessionKeys.success) {
        onchainValidatorData.nextSessionKeys = resSessionKeys.data;
    } else {
        onchainValidatorData.errors.push({
            "failedDataFetch": "Session Keys",
            "error": resSessionKeys.error
        });
    }

    const resIdentity = await _getIdentity(api, account);

    if (resIdentity.success) {
        onchainValidatorData.identity = resIdentity.data;
    } else {
        onchainValidatorData.errors.push({
            "failedDataFetch": "Identity",
            "error": resIdentity.error
        });
    }

    const resValidatorPrefs = await _getValidatorPrefs(api, account);

    if (resValidatorPrefs) {
        onchainValidatorData.commission = resValidatorPrefs.data.commission;
        onchainValidatorData.blockedNominations = resValidatorPrefs.data.blocked;
    } else {
        onchainValidatorData.errors.push({
            "failedDataFetch": "Validator Prefs",
            "error": resValidatorPrefs.error
        });
    }

    return onchainValidatorData;

}

module.exports = {
    getOnchainValidatorData
}

