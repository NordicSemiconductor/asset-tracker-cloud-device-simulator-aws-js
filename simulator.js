#!/usr/bin/env node

const chalk = require('chalk')

const die = (err) => {
	console.error(chalk.red(`An unhandled exception occured!`))
	console.error(chalk.red(err.message))
	process.exit(1)
}

process.on('uncaughtException', die)
process.on('unhandledRejection', die)

const { simulator } = require('./dist/simulator')
simulator()
