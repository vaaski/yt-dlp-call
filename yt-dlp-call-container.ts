import { execa, execaCommand } from "execa"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

const CALL_END = /call with .+ terminated/gi
const CALL_ANSWER = /call answered/gi
const CALL_ESTABLISHED = /call established/gi

const AUDIO_FOLDER = "/audio"
const SIP_SERVER = "192.168.0.1"
const FFMPEG_FLAGS = "-ac 1 -ar 8000 -acodec pcm_s16le"

const [, , number, url] = process.argv

const parsedNumber = Number.parseInt(number)
if (Number.isNaN(parsedNumber)) throw new Error("invalid number")

const main = async () => {
  console.log("downloading")
  mkdir(AUDIO_FOLDER, { recursive: true })

  const ytDlp = execaCommand(`yt-dlp --no-playlist -x -o - ${url}`, { stdout: "pipe" })
  if (!ytDlp.pipeStdout) throw new Error("no yt-dlp stdout")

  const ffmpeg = execaCommand(
    `ffmpeg -y -i - ${FFMPEG_FLAGS} ${join(AUDIO_FOLDER, "output.wav")}`,
  )

  await ytDlp.pipeStdout(ffmpeg)
  await ffmpeg

  console.log(`calling ${number}`)
  const call = execa(
    "baresip",
    ["-e", `/ausrc aufile,/audio/output.wav`, "-e", `/dial ${number}@${SIP_SERVER}`],
    { stdout: "pipe", stdin: "inherit" },
  )

  if (!call.stdout) throw new Error("no call stdout")

  call.stdout.on("data", (buffer) => {
    const message = buffer.toString()

    if (CALL_END.test(message)) {
      console.log("call ended")
      process.exit(0)
    } else if (CALL_ANSWER.test(message)) {
      console.log("call answered")
    } else if (CALL_ESTABLISHED.test(message)) {
      console.log("call connected")
    }
  })

  await call
}

main()
