import type { Config } from '@nordicsemiconductor/asset-tracker-cloud-docs/protocol'
import type { Static } from '@sinclair/typebox'
import { thingShadow } from 'aws-iot-device-sdk'
import chalk from 'chalk'

export const defaultConfig: Static<typeof Config> = {
	act: false, // Whether to enable the active mode
	actwt: 60, //In active mode: wait this amount of seconds until sending the next update. The actual interval will be this time plus the time it takes to get a GNSS fix.
	mvres: 300, // (movement resolution) In passive mode: Time in seconds to wait after detecting movement before sending the next update
	mvt: 3600, // (movement timeout) In passive mode: Send update at least this often (in seconds)
	loct: 60, // GNSS timeout (in seconds): timeout for GNSS fix
	accath: 10, // Accelerometer activity threshold in m/s²: Minimal absolute value for an accelerometer reading to be considered movement.
	accith: 5, // Accelerometer inactivity threshold in m/s²: Maximum absolute value for an accelerometer reading to be considered stillness. Should be lower than the activity threshold.
	accito: 60, // Accelerometer inactivity timeout in s: Hysteresis timeout for stillness detection.
	nod: [],
}

/**
 * Connect to the AWS IoT broker using a generated device certificate
 */
export const connect = async ({
	clientCert,
	privateKey,
	caCert,
	version,
	endpoint,
	deviceId,
}: {
	clientCert: Buffer
	caCert: Buffer
	privateKey: Buffer
	endpoint: string
	deviceId: string
	version?: string
}): Promise<void> => {
	let cfg = defaultConfig
	const devRoam = {
		dev: {
			v: {
				modV: 'device-simulator',
				brdV: 'device-simulator',
				appV: version ?? '0.0.0-development',
				iccid: '12345678901234567890',
				imei: '352656106111232',
			},
			ts: Date.now(),
		},
		roam: {
			v: {
				band: 666,
				nw: 'LAN',
				rsrp: -70,
				area: 30401,
				mccmnc: 24201,
				cell: 16964098,
				ip: '0.0.0.0',
				eest: 9,
			},
			ts: Date.now(),
		},
	}

	console.time(chalk.green(chalk.inverse(' connected ')))

	const note = chalk.magenta(
		`Still connecting ... First connect takes around 30 seconds`,
	)
	console.time(note)
	const connectingNote = setInterval(() => {
		console.timeLog(note)
	}, 5000)

	console.log()
	console.log(chalk.blue(' endpoint:   '), chalk.yellow(endpoint))
	console.log(chalk.blue(' deviceId:   '), chalk.yellow(deviceId))
	console.log(chalk.blue(' version:    '), chalk.yellow(version))
	console.log()

	const connection = new thingShadow({
		privateKey,
		clientCert,
		caCert,
		clientId: deviceId,
		host: endpoint,
		region: endpoint.split('.')[2],
	})

	connection.on('connect', async () => {
		console.timeEnd(chalk.green(chalk.inverse(' connected ')))
		clearInterval(connectingNote)

		connection.register(deviceId, {}, async () => {
			console.log(
				chalk.magenta('>'),
				chalk.cyan(
					JSON.stringify({ state: { reported: { cfg, ...devRoam } } }),
				),
			)
			connection.update(deviceId, { state: { reported: { cfg, ...devRoam } } })
		})

		connection.on('close', () => {
			console.error(chalk.red(chalk.inverse(' disconnected! ')))
		})

		connection.on('reconnect', () => {
			console.log(chalk.magenta('reconnecting...'))
		})

		connection.on('status', (_, stat, __, stateObject) => {
			console.log(chalk.magenta('>'), chalk.cyan(stat))
			console.log(chalk.magenta('>'), chalk.cyan(JSON.stringify(stateObject)))
			if (stat === 'accepted') {
				cfg = {
					...cfg,
					...(stateObject?.desired?.cfg ?? {}),
				}
			}
		})

		connection.on('delta', (_, stateObject) => {
			console.log(chalk.magenta('<'), chalk.cyan(JSON.stringify(stateObject)))
			cfg = {
				...cfg,
				...stateObject.state.cfg,
			}
			console.log(
				chalk.magenta('>'),
				chalk.cyan(JSON.stringify({ state: { reported: { cfg } } })),
			)
			connection.update(deviceId, { state: { reported: { cfg } } })
		})

		connection.on('timeout', (thingName, clientToken) => {
			console.log(
				'received timeout on ' + thingName + ' with token: ' + clientToken,
			)
		})

		connection.on('message', (topic, payload) => {
			console.log(
				chalk.magenta('>'),
				chalk.blue.blueBright(topic),
				chalk.cyan(payload.toString()),
			)
		})

		connection.subscribe(`${deviceId}/pgps`)
		connection.subscribe(`${deviceId}/agps`)
	})
}
