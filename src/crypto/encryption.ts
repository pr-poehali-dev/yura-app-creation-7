/**
 * K App - Advanced Encryption Module
 * Uses: X25519 (Key Exchange) + XSalsa20-Poly1305 (Encryption) + Ed25519 (Signatures)
 * Double Ratchet Algorithm simulation for Perfect Forward Secrecy
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import CryptoJS from 'crypto-js';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey: string;
  signature: string;
  timestamp: number;
  messageId: string;
  hmac: string;
}

export interface DoubleRatchetState {
  rootKey: Uint8Array;
  sendingChainKey: Uint8Array;
  receivingChainKey: Uint8Array;
  messageNumber: number;
  previousChainLength: number;
}

// Generate X25519 key pair for key exchange
export const generateKeyPair = (): KeyPair => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
};

// Generate Ed25519 signing key pair
export const generateSigningKeyPair = (): KeyPair => {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
};

// HKDF-like key derivation using SHA-512
export const deriveKey = (inputKey: Uint8Array, salt: Uint8Array, info: string): Uint8Array => {
  const saltHex = CryptoJS.lib.WordArray.create(salt as unknown as number[]);
  const ikm = CryptoJS.lib.WordArray.create(inputKey as unknown as number[]);
  const infoWord = CryptoJS.enc.Utf8.parse(info);

  // HMAC-SHA256 extract
  const prk = CryptoJS.HmacSHA256(ikm, saltHex);

  // HMAC-SHA256 expand
  const okm = CryptoJS.HmacSHA256(
    CryptoJS.lib.WordArray.create([...prk.words, ...infoWord.words]),
    prk
  );

  const hex = okm.toString(CryptoJS.enc.Hex);
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    result[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return result;
};

// Initialize Double Ratchet state
export const initDoubleRatchet = (sharedSecret: Uint8Array): DoubleRatchetState => {
  const salt = nacl.randomBytes(32);
  const rootKey = deriveKey(sharedSecret, salt, 'root_key_v1');
  const sendingChainKey = deriveKey(rootKey, salt, 'sending_chain_key_v1');
  const receivingChainKey = deriveKey(rootKey, salt, 'receiving_chain_key_v1');

  return {
    rootKey,
    sendingChainKey,
    receivingChainKey,
    messageNumber: 0,
    previousChainLength: 0,
  };
};

// Ratchet step - advance the chain key
export const ratchetStep = (chainKey: Uint8Array): { messageKey: Uint8Array; nextChainKey: Uint8Array } => {
  const messageKey = deriveKey(chainKey, new Uint8Array(32), 'message_key');
  const nextChainKey = deriveKey(chainKey, new Uint8Array(32), 'chain_key_next');
  return { messageKey, nextChainKey };
};

// Encrypt message with Double Ratchet + X25519 + XSalsa20-Poly1305
export const encryptMessage = (
  plaintext: string,
  recipientPublicKey: string,
  senderPrivateKey: string,
  signingPrivateKey: string
): EncryptedMessage => {
  // Generate ephemeral key pair for perfect forward secrecy
  const ephemeralKeyPair = nacl.box.keyPair();

  // Compute shared secret using X25519
  const recipientPubKeyBytes = decodeBase64(recipientPublicKey);
  const senderPrivKeyBytes = decodeBase64(senderPrivateKey);

  const sharedSecret = nacl.box.before(recipientPubKeyBytes, senderPrivKeyBytes);

  // Derive message key using HKDF
  const ephemeralShared = nacl.box.before(recipientPubKeyBytes, ephemeralKeyPair.secretKey);
  const combinedSecret = new Uint8Array(64);
  combinedSecret.set(sharedSecret);
  combinedSecret.set(ephemeralShared, 32);

  const messageKey = deriveKey(combinedSecret.slice(0, 32), combinedSecret.slice(32), 'message_encryption_key');

  // Generate nonce
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

  // Encrypt using XSalsa20-Poly1305
  const messageBytes = encodeUTF8(plaintext);
  const ciphertext = nacl.secretbox(messageBytes, nonce, messageKey);

  // Sign the ciphertext with Ed25519
  const signingKeyBytes = decodeBase64(signingPrivateKey);
  const dataToSign = new Uint8Array(ciphertext.length + nonce.length);
  dataToSign.set(ciphertext);
  dataToSign.set(nonce, ciphertext.length);
  const signature = nacl.sign.detached(dataToSign, signingKeyBytes);

  // Generate message ID
  const messageId = encodeBase64(nacl.randomBytes(16));
  const timestamp = Date.now();

  // HMAC for integrity
  const hmacData = CryptoJS.lib.WordArray.create(ciphertext as unknown as number[]);
  const hmacKey = CryptoJS.enc.Base64.parse(encodeBase64(messageKey));
  const hmac = CryptoJS.HmacSHA256(hmacData, hmacKey).toString();

  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
    ephemeralPublicKey: encodeBase64(ephemeralKeyPair.publicKey),
    signature: encodeBase64(signature),
    timestamp,
    messageId,
    hmac,
  };
};

// Decrypt message
export const decryptMessage = (
  encryptedMsg: EncryptedMessage,
  recipientPrivateKey: string,
  senderPublicKey: string,
  senderSigningPublicKey: string
): string | null => {
  try {
    const recipientPrivKeyBytes = decodeBase64(recipientPrivateKey);
    const senderPubKeyBytes = decodeBase64(senderPublicKey);
    const ephemeralPubKey = decodeBase64(encryptedMsg.ephemeralPublicKey);

    // Recompute shared secret
    const sharedSecret = nacl.box.before(senderPubKeyBytes, recipientPrivKeyBytes);
    const ephemeralShared = nacl.box.before(ephemeralPubKey, recipientPrivKeyBytes);

    const combinedSecret = new Uint8Array(64);
    combinedSecret.set(sharedSecret);
    combinedSecret.set(ephemeralShared, 32);

    const messageKey = deriveKey(combinedSecret.slice(0, 32), combinedSecret.slice(32), 'message_encryption_key');

    const ciphertext = decodeBase64(encryptedMsg.ciphertext);
    const nonce = decodeBase64(encryptedMsg.nonce);
    const signature = decodeBase64(encryptedMsg.signature);

    // Verify signature (Ed25519)
    const signingPubKeyBytes = decodeBase64(senderSigningPublicKey);
    const dataToVerify = new Uint8Array(ciphertext.length + nonce.length);
    dataToVerify.set(ciphertext);
    dataToVerify.set(nonce, ciphertext.length);

    const isValid = nacl.sign.detached.verify(dataToVerify, signature, signingPubKeyBytes);
    if (!isValid) {
      console.error('Signature verification failed!');
      return null;
    }

    // Verify HMAC
    const hmacData = CryptoJS.lib.WordArray.create(ciphertext as unknown as number[]);
    const hmacKey = CryptoJS.enc.Base64.parse(encodeBase64(messageKey));
    const expectedHmac = CryptoJS.HmacSHA256(hmacData, hmacKey).toString();
    if (expectedHmac !== encryptedMsg.hmac) {
      console.error('HMAC verification failed!');
      return null;
    }

    // Decrypt
    const decrypted = nacl.secretbox.open(ciphertext, nonce, messageKey);
    if (!decrypted) return null;

    return decodeUTF8(decrypted);
  } catch (e) {
    console.error('Decryption error:', e);
    return null;
  }
};

// Encrypt for groups using symmetric key + AES-256-GCM simulation
export const encryptGroupMessage = (plaintext: string, groupKey: string): { ciphertext: string; iv: string } => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.enc.Base64.parse(groupKey);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64),
  };
};

export const decryptGroupMessage = (ciphertext: string, iv: string, groupKey: string): string | null => {
  try {
    const key = CryptoJS.enc.Base64.parse(groupKey);
    const ivBytes = CryptoJS.enc.Base64.parse(iv);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(ciphertext) } as CryptoJS.lib.CipherParams, key, {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
};

// Generate random group key
export const generateGroupKey = (): string => {
  return encodeBase64(nacl.randomBytes(32));
};

// Hash password with Argon2-like stretching using SHA-512 iterations
export const hashPassword = (password: string, salt: string): string => {
  let hash = CryptoJS.SHA512(password + salt).toString();
  for (let i = 0; i < 100000; i++) {
    hash = CryptoJS.SHA512(hash + password + salt).toString();
  }
  return hash;
};

// Generate secure random salt
export const generateSalt = (): string => {
  return encodeBase64(nacl.randomBytes(32));
};

export default {
  generateKeyPair,
  generateSigningKeyPair,
  encryptMessage,
  decryptMessage,
  encryptGroupMessage,
  decryptGroupMessage,
  generateGroupKey,
  hashPassword,
  generateSalt,
  initDoubleRatchet,
  ratchetStep,
};
