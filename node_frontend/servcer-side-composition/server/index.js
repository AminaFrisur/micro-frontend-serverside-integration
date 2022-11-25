import * as std from 'std';
import * as http from 'wasi_http';
import * as net from 'wasi_net';
import {makeRequest} from '../src/utils/ApiHelper.js'
// Liste aller Micro-Frontends
// Aufgabe von diesem Service:
// Nehme Anfragen an und setze aus den verschiedenen Frontends das Ergebnis zusammen
let microFrontendLoginUrl = "localhost";
let microFrontendLoginPort = "8100";
let microFrontendRechnungUrl = "localhost"
let microFrontendRechnungPort = "8101"

async function handle_client(cs) {
    let buffer = new http.Buffer();
    let parameter;

    while (true) {
        try {
            let d = await cs.read();
            if (d == undefined || d.byteLength <= 0) {
                return;
            }
            buffer.append(d);
            parameter = new TextDecoder().decode(buffer);
            let req = buffer.parseRequest();
            if (req instanceof http.WasiRequest) {
                handle_req(cs, req, parameter);
                break;
            }
        } catch (e) {
            print(e);
        }
    }
}

function enlargeArray(oldArr, newLength) {
    let newArr = new Uint8Array(newLength);
    oldArr && newArr.set(oldArr, 0);
    return newArr;
}

function getHtmlData(response) {
    let data = "error";
    if(response.responseText) {
        data = response.responseText;
    }
    return data
}

async function handle_req(s, req, parameter) {

    print('Server Side Composition: Uri ist:', req.uri);
    print('Server Side Composition:', req.method);

    let contentType = '';
    let reqHeaders = req.headers;
    let respHeaders = undefined;

    let resp = new http.WasiResponse();
    let content = std.loadFile('./build/index.html');

    // Initialer Aufruf: Rufe hier direkt das Micro-Frontend Login auf
    if((req.uri == '/' || req.uri == '/login') && req.method.toUpperCase() === "GET") {
        let response = await makeRequest(parameter, reqHeaders, microFrontendLoginUrl, microFrontendLoginPort, "/login", "GET");
        let html = getHtmlData(response);

        content = content.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
        respHeaders = response.headers;

    } else if((req.uri == '/' || req.uri == '/login') && req.method.toUpperCase() === "POST") {

        let response = await makeRequest(parameter, reqHeaders, microFrontendLoginUrl, microFrontendLoginPort, "/login", "POST");
        let html = getHtmlData(response);
        respHeaders = response.headers;
        content = content.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    }


    else if(req.uri == '/register' && req.method.toUpperCase() === "GET") {
        let response = await makeRequest(parameter, reqHeaders, microFrontendLoginUrl, microFrontendLoginPort, "/register", "GET");
        let html = getHtmlData(response);
        respHeaders = response.headers;
        content = content.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    }



    else if(req.uri == '/getUsers' && req.method.toUpperCase() === "GET") {
        let headers = req.headers;
        let response = await makeRequest(parameter, headers, microFrontendLoginUrl, microFrontendLoginPort, "/getUsers", "GET");
        let html = getHtmlData(response);
        respHeaders = response.headers;
        content = content.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    }




    else {
        let chunk = 1000; // Chunk size of each reading
        let length = 0; // The whole length of the file
        let byteArray = null; // File content as Uint8Array

        // Read file into byteArray by chunk
        let file = std.open('./build' + req.uri, 'r');
        while (true) {
            byteArray = enlargeArray(byteArray, length + chunk);
            let readLen = file.read(byteArray.buffer, length, chunk);
            length += readLen;
            if (readLen < chunk) {
                break;
            }
        }
        content = byteArray.slice(0, length).buffer;
        file.close();
    }
    if(contentType == '') {
        contentType = 'text/html; charset=utf-8';
    }

    if (req.uri.endsWith('.css')) {
        contentType = 'text/css; charset=utf-8';
    } else if (req.uri.endsWith('.js')) {
        contentType = 'text/javascript; charset=utf-8';
    } else if (req.uri.endsWith('.json')) {
        contentType = 'text/json; charset=utf-8';
    } else if (req.uri.endsWith('.ico')) {
        contentType = 'image/vnd.microsoft.icon';
    } else if (req.uri.endsWith('.png')) {
        contentType = 'image/png';
    }

    if(respHeaders && respHeaders["Set-Cookie"]) {
        resp.headers = {
            'Content-Type': contentType,
            'Set-Cookie': respHeaders["Set-Cookie"]
        };
    } else {
        resp.headers = {
            'Content-Type': contentType
        };
    }
    let r = resp.encode(content);
    s.write(r);
}

async function server_start() {
    print('listen 8200...');
    try {
        let s = new net.WasiTcpServer(8200);
        for (var i = 0; ; i++) {
            let cs = await s.accept();
            handle_client(cs);
        }
    } catch (e) {
        print(e);
    }
}

server_start();