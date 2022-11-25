import {fetch} from "http";

export async function makeRequest(bodyData, headers, hostname, port, path, method) {
  let result;
  // onsole.log(JSON.stringify(headers));
  console.log("ApiHelper: Make " + method + " Request");
  console.log("ApiHelper: Request to " + "http://" + hostname + ":" + port + path );
  let resp = await fetch("http://" + hostname + ":" + port + path, { method: method, body: bodyData, headers: headers });
  console.log("Return Status von Post Request ist " + resp.status);
  result = await resp.text();
  return {"responseText": result, "headers": resp.headers}
}

