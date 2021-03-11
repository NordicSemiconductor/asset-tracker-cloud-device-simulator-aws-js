import { connect } from './connect'
import * as fs from 'fs'
import * as path from 'path'

export const simulator = (): void => {
	const certJSON = process.argv[process.argv.length - 1]
	let privateKey: string,
		clientCert: string,
		deviceId: string,
		endpoint: string,
		version: string
	try {
		const c = JSON.parse(fs.readFileSync(certJSON, 'utf-8')) as {
			privateKey: string
			clientCert: string
			clientId: string
			brokerHostname: string
		}
		privateKey = c.privateKey
		clientCert = c.clientCert
		deviceId = c.clientId
		endpoint = c.brokerHostname
	} catch {
		throw new Error(`Failed to parse the certificate JSON using ${certJSON}!`)
	}

	const packageJSON = path.resolve(__dirname, '..', 'package.json')
	try {
		const pjson = JSON.parse(fs.readFileSync(packageJSON, 'utf-8'))
		version = pjson.version
	} catch {
		throw new Error(`Failed to parse ${packageJSON}!`)
	}

	void connect({
		privateKey: Buffer.from(privateKey),
		clientCert: Buffer.from(clientCert),
		caCert: Buffer.from(
			fs.readFileSync(
				path.resolve(__dirname, '..', 'data', 'AmazonRootCA1.pem'),
				'utf-8',
			),
		),
		deviceId,
		endpoint,

		version,
	})
}
