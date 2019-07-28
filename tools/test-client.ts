import { BinaryLike } from "crypto";
import { default as rp } from "request-promise";
import { HandshakeClient } from "swish-protocol";

import { SwishClient } from "./../src/index";

const SERVER_URL = "http://localhost:3000";
const clientHS = new HandshakeClient();

async function test() {
	try {
		const handshakeResponse = await testHandShake();

		if (handshakeResponse.status === "ok") {
			console.log("[SUCCESS]HANDSHAKE_PAIRED");
		} else {
			throw new Error("HANDSHAKE_FAILED");
		}

		// now lets start communicating to the secured endpoints
		await testRequest({
			action: "hello", message: "Adonis Villamor", passcode: "whoami",
		});

		// send a different one this time
		await testRequest({ action: "move", message: "Japan", passcode: "whereami"  });
	} catch (err) {
		console.error(err);
	}
}

async function testHandShake() {
	console.log("################################################################################");
	const swish = clientHS.generateHandshake();
	console.log("***HANDSHAKE:INITIATING***");
	// run the request. we don't use async await coz request-promise uses bluebird
	return rp({
		headers: swish.headers,
		method: "GET",
		resolveWithFullResponse: true,
		uri: `${SERVER_URL}/auth/swish/handshake`,
	}).then((response) => {
		console.log("***HANDSHAKE:RECEIVED***");
		console.dir(response.headers);
		console.dir(response.body);
		const dec: any = clientHS.handleHandshakeResponse(response.headers, response.body);
		console.dir(dec);
		return dec;
	}).catch((err) => {
		console.error(err);
	});
}

async function testRequest(body: BinaryLike | object) {
	console.log("***SENDING***");
	console.dir(body);
	const swish = clientHS.encryptRequest(body);
	// run the request. we don't use async await coz request-promise uses bluebird
	return rp({
		body: swish.body,
		headers: swish.headers,
		json: true,
		method: "POST",
		resolveWithFullResponse: true,
		uri: `${SERVER_URL}/test`,
	}).then((response) => {
		const dec: any = clientHS.decryptResponse(response.headers, response.body);
		console.log("***RECEIVED_RESPONSE***");
		console.dir(dec);
		console.log("********************************************************************");
		console.log("");
	}).catch((err) => {
		console.error(err);
	});;
}

void test();
