import { keccak256 } from "ethereum-cryptography/keccak";
import { secp } from "ethereum-cryptography/secp256k1";
import { utf8ToBytes, randomPrivateKey } from "ethereum-cryptography/utils";


async function signMessage(msg, PRIVATE_KEY) {
    const messageHash = hashMessage(msg);
    return secp.sign(messageHash, PRIVATE_KEY, { recovered: true });
}


async function recoverKey(message, signature, recoveryBit) {
    const messageHash = hashMessage(message);
    return secp.recoverPublicKey(messageHash, signature, recoveryBit);
}

function getAddress(publicKey) {
    return keccak256(publicKey.slice(1)).slice(-20);
}

function hashMessage(message) {
    return keccak256((utf8ToBytes(message)))
}


module.exports = {
    getAddress,
    signMessage,
    recoverKey
};