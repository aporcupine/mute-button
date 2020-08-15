'use strict'

let port
let reader
let inputDone
let outputDone
let inputStream
let outputStream
let closed 
let lastMuteState

/**
* @name connect
* Opens a Web Serial connection to the arduino.
*/
const connect = async () => {
  // Request a port and open a connection.
  port = await navigator.serial.requestPort()
  // Wait for the port to open.
  await port.open({ baudrate: 9600 })
  
  // Setup the output stream.
  const encoder = new TextEncoderStream()
  outputDone = encoder.readable.pipeTo(port.writable)
  outputStream = encoder.writable
  
  // Setup input stream.
  const decoder = new TextDecoderStream()
  inputDone = port.readable.pipeTo(decoder.writable)
  inputStream = decoder.readable
  
  reader = inputStream.getReader()

  // Listen for leave meeting click.
  listenForLeave()
  // Start the read loop.
  readLoop()
}


/**
* @name disconnect
* Closes the Web Serial connection.
*/
const disconnect = async () => {
  console.log("Closing serial connection.")
  
  // Close the input stream.
  if (reader) {
    await reader.cancel()
    await inputDone.catch(() => {})
    reader = null
    inputDone = null
  }
  
  // Close the output stream.
  if (outputStream) {
    await outputStream.getWriter().close()
    await outputDone
    outputStream = null
    outputDone = null
  }
  
  // Close the port.
  await port.close()
  port = null
}


/**
* @name handleJoinMeeting
* Click handler for the join button.
*/
const handleJoinMeeting = async () => {
  await connect()
  // set initial timeout for sending mute value
  setTimeout(sendMuteValue, 100)
}


/**
* @name readLoop
* Reads data from the input stream and triggers a mute click.
*/
const readLoop = async () => {
  // Loop over input until done
  while (true) {
    const { value, done } = await reader.read()
    if (value) {
      // If we got a 1, then the button has been pushed so initiate a mute click.
      if (value == "1") {
        const el = document.querySelector("div[role='button'][data-tooltip*='microphone']")
        el.click()
      }
    }
    if (done) {
      reader.releaseLock()
      break
    }
  }
}


/**
* @name writeToStream
* Gets a writer from the output stream and send the lines to the Arduino.
* @param  {...string} lines lines to send to the arduino
*/
const writeToStream = (...lines) => {
  // Write to output stream.
  const writer = outputStream.getWriter()
  lines.forEach((line) => {
    writer.write(line + '\n')
  })
  writer.releaseLock()
}

/**
* @name sendMuteValue
* Sends the current mute value if changed since the last update.
*/
const sendMuteValue = () => {
  // Return early if we're not connected.
  if (!port) {
    return
  }
  const el = document.querySelector("div[role='button'][data-tooltip*='microphone']")
  const v = el.dataset.isMuted == "true" ? 1 : 0
  if (lastMuteState != v) {
    lastMuteState = v
    writeToStream(v)
  }
  setTimeout(sendMuteValue, 500)
}


/**
* @name listenForJoinNow
* Listens for a mouseup event on the Join Now button to initiate the serial connection.
*/
const listenForJoinNow = () => {
  // Hacky way of getting element by content.
  const results = document.evaluate("//span[contains(., 'Join now')]", document, null, XPathResult.ANY_TYPE, null )
  // There's only one.
  const span = results.iterateNext()
  // No results? Do nothing!
  if (!span) return
  span.parentElement.addEventListener("mouseup", handleJoinMeeting)
}


/**
* @name listenForLeave
* Listens for a mouseup event on the leave meeting button to disconnect the serial connection.
*/
const listenForLeave = () => {
  const el = document.querySelector("div[role='button'][data-tooltip*='Leave call']")
  el.addEventListener("mousedown", disconnect)
}


listenForJoinNow()