const { default: fendiConnect, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, getContentType } = require("@adiwajshing/baileys")
const { state, saveState } = useSingleFileAuthState(`./session.json`)
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

async function start() {
  const momol = fendiConnect({
	  logger: pino({ level: 'silent' }),
	  printQRInTerminal: true,
	  browser: ['Momol Wangy','Safari','1.0'],
	  auth: state
  })
  
  store.bind(momol.ev)
  
  const unhandledRejections = new Map()
  process.on('unhandledRejection', (reason, promise) => {
    unhandledRejections.set(promise, reason)
    console.log('Unhandled Rejection at:', promise, 'reason:', reason)
  })
  process.on('rejectionHandled', (promise) => {
    unhandledRejections.delete(promise)
  })
  process.on('Something went wrong', function(err) {
    console.log('Caught exception: ', err)
  })
  
  // Setting
  momol.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}
      return decode.user && decode.server && decode.user + '@' + decode.server || jid
    } else return jid
  }
  
  momol.setStatus = (status) => {
    momol.query({
      tag: 'iq',
      attrs: {
        to: '@s.whatsapp.net',
        type: 'set',
        xmlns: 'status',
      },
      content: [{
        tag: 'status',
        attrs: {},
        content: Buffer.from(status, 'utf-8')
      }]
    })
    return status
  }
  
  momol.public = true

  momol.ev.on('creds.update', saveState)
  
  momol.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log('Bot conneted to server')
    }
  })
  return momol
}

start()