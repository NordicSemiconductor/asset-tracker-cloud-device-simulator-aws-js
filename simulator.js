#!/usr/bin/env node

import chalk from 'chalk'

const die = (err) => {
	console.error(chalk.red(`An unhandled exception occured!`))
	console.error(chalk.red(err.message))
	process.exit(1)
}

process.on('uncaughtException', die)
process.on('unhandledRejection', die)

import { simulator } from './dist/simulator.js'
simulator()
