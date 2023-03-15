import fs from 'node:fs'
import path, { parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect } from './connect.js'

export const simulator = (): void => {
	const certJSON = process.argv[process.argv.length - 1] ?? '{}'
	let privateKey: string,
		clientCert: string,
		caCert: string,
		deviceId: string,
		endpoint: string,
		version: string
	try {
		const c = JSON.parse(fs.readFileSync(certJSON, 'utf-8')) as {
			privateKey: string
			clientCert: string
			caCert: string
			clientId: string
			brokerHostname: string
		}
		privateKey = c.privateKey
		clientCert = c.clientCert
		caCert = c.caCert
		deviceId = c.clientId
		endpoint = c.brokerHostname
	} catch {
		throw new Error(`Failed to parse the certificate JSON using ${certJSON}!`)
	}

	const packageJSON = path.resolve(
		parse(fileURLToPath(import.meta.url)).dir,
		'..',
		'package.json',
	)
	try {
		const pjson = JSON.parse(fs.readFileSync(packageJSON, 'utf-8'))
		version = pjson.version
	} catch {
		throw new Error(`Failed to parse ${packageJSON}!`)
	}

	void connect({
		privateKey: Buffer.from(privateKey),
		clientCert: Buffer.from(clientCert),
		caCert: Buffer.from(caCert),
		deviceId,
		endpoint,
		version,
	})
}
