const dgram = require('node:dgram');

/**
 * Encodes a string to OSC format (null-terminated, 4-byte padded).
 */
function encodeString(s) {
    const buf = Buffer.from(s + '\0');
    const padding = (4 - (buf.length % 4)) % 4;
    return Buffer.concat([buf, Buffer.alloc(padding)]);
}

/**
 * Encodes a boolean to OSC format (using T/F type tags).
 */
function encodeBoolean(b) {
    return b ? 'T' : 'F';
}

/**
 * Encodes a float to OSC format (4-byte big-endian).
 */
function encodeFloat(f) {
    const buf = Buffer.alloc(4);
    buf.writeFloatBE(f, 0);
    return buf;
}

/**
 * Sends an OSC packet to VRChat.
 */
function sendOSC(address, types, args, port = 9000) {
    const addrBuf = encodeString(address);
    const typeBuf = encodeString(',' + types);
    const argBufs = args.map((arg, i) => {
        const type = types[i];
        if (type === 's') return encodeString(arg);
        if (type === 'f') return encodeFloat(parseFloat(arg));
        return Buffer.alloc(0); // T/F are handled in type tags
    });

    const packet = Buffer.concat([addrBuf, typeBuf, ...argBufs]);
    const client = dgram.createSocket('udp4');
    
    client.send(packet, port, '127.0.0.1', (err) => {
        if (err) console.error('OSC Error:', err);
        client.close();
    });
}

const cmd = process.argv[2];
const val = process.argv[3];

if (cmd === 'chat') {
    // Usage: node vrc-osc.js chat "Hello!"
    sendOSC('/chatbox/input', 'sT', [val]);
    console.log(`Sent to VRChat Chatbox: ${val}`);
} else if (cmd === 'param') {
    // Usage: node vrc-osc.js param "MyParameterName" 1.0 (float)
    const paramName = val;
    const paramValue = process.argv[4];
    sendOSC(`/avatar/parameters/${paramName}`, 'f', [paramValue]);
    console.log(`Sent to VRChat Parameter ${paramName}: ${paramValue}`);
} else {
    console.log('Usage:');
    console.log('  node vrc-osc.js chat "Message"');
    console.log('  node vrc-osc.js param "ParamName" 1.0');
}
