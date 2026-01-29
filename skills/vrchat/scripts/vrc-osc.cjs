const dgram = require('node:dgram');
const http = require('node:http');

/**
 * Encodes a string to OSC format (null-terminated, 4-byte padded).
 */
function encodeString(s) {
    const buf = Buffer.from(s + '\0');
    const padding = (4 - (buf.length % 4)) % 4;
    return Buffer.concat([buf, Buffer.alloc(padding)]);
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
 * Encodes an int to OSC format (4-byte big-endian).
 */
function encodeInt(i) {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(i, 0);
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
        if (type === 'i') return encodeInt(parseInt(arg, 10));
        return Buffer.alloc(0); // T/F/N are in type tags
    });

    const packet = Buffer.concat([addrBuf, typeBuf, ...argBufs]);
    const client = dgram.createSocket('udp4');
    
    return new Promise((resolve) => {
        client.send(packet, port, '127.0.0.1', (err) => {
            if (err) console.error('OSC Error:', err);
            client.close();
            resolve();
        });
    });
}

async function run() {
    const cmd = process.argv[2];
    const val = process.argv[3];
    const extra = process.argv[4];

    if (cmd === 'chat') {
        // Usage: node vrc-osc.cjs chat "Message" [sfx:true|false]
        const sfx = extra === 'false' ? 'F' : 'T';
        await sendOSC('/chatbox/input', 's' + sfx + 'T', [val]);
        console.log(`Sent to VRChat Chatbox (SFX:${sfx}): ${val}`);
    } else if (cmd === 'param') {
        // Usage: node vrc-osc.cjs param Name Type Value
        const name = val;
        const typeChar = extra;
        const rawVal = process.argv[5];
        let oscType = typeChar;
        let args = [rawVal];
        if (typeChar === 'b') {
            oscType = rawVal === 'true' || rawVal === '1' ? 'T' : 'F';
            args = [];
        }
        await sendOSC(`/avatar/parameters/${name}`, oscType, args);
        console.log(`Sent: ${name} = ${rawVal}`);
    } else if (cmd === 'cam') {
        // Usage: node vrc-osc.cjs cam zoom 0.5
        const sub = val;
        const rawVal = extra;
        const address = `/usercamera/${sub}`;
        await sendOSC(address, 'f', [rawVal]);
        console.log(`Camera: ${address} = ${rawVal}`);
    } else if (cmd === 'input') {
        await sendOSC(`/input/${val}`, 'i', [1]);
        setTimeout(async () => {
            await sendOSC(`/input/${val}`, 'i', [0]);
            console.log(`Triggered: ${val}`);
            process.exit(0);
        }, 50);
        return;
    } else if (cmd === 'query') {
        const port = val || 9001;
        http.get(`http://127.0.0.1:${port}/`, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                console.log(data);
                process.exit(0);
            });
        }).on('error', (err) => {
            console.error('Error:', err.message);
            process.exit(1);
        });
        return;
    } else {
        console.log('Usage:');
        console.log('  chat "Text" [sfx:true|false]');
        console.log('  param "Name" "f|i|b" "Value"');
        console.log('  cam "zoom|mode|aperture" "Value"');
        console.log('  input "Jump"');
        console.log('  query [port]');
    }
}

run();
