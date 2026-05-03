// 四隅から白い領域を flood fill して透過化する。
// キャラ内部の白（顔マスクなど）は端から繋がってなければ保持される。
const sharp = require('sharp')
const fs = require('fs')

const T_HARD = 232
const T_SOFT = 200

async function transparify(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const N = width * height
  const visited = new Uint8Array(N)
  const queue = new Int32Array(N)
  let head = 0
  let tail = 0

  const isHard = (i) =>
    data[i] >= T_HARD && data[i + 1] >= T_HARD && data[i + 2] >= T_HARD
  const isSoft = (i) =>
    data[i] >= T_SOFT && data[i + 1] >= T_SOFT && data[i + 2] >= T_SOFT

  const seed = (x, y) => {
    const p = y * width + x
    if (visited[p]) return
    if (isHard(p * 4)) {
      visited[p] = 1
      queue[tail++] = p
    }
  }
  for (let x = 0; x < width; x++) {
    seed(x, 0)
    seed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    seed(0, y)
    seed(width - 1, y)
  }

  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    const y = (p / width) | 0
    data[p * 4 + 3] = 0
    const tryPush = (np) => {
      if (visited[np]) return
      if (isHard(np * 4)) {
        visited[np] = 1
        queue[tail++] = np
      }
    }
    if (x > 0) tryPush(p - 1)
    if (x < width - 1) tryPush(p + 1)
    if (y > 0) tryPush(p - width)
    if (y < height - 1) tryPush(p + width)
  }

  // 境界アンチエイリアス：透明領域に隣接した「やや白」ピクセルの α を下げる
  for (let p = 0; p < N; p++) {
    if (visited[p]) continue
    const idx = p * 4
    if (!isSoft(idx)) continue
    const x = p % width
    const y = (p / width) | 0
    let touches = false
    if (x > 0 && visited[p - 1]) touches = true
    else if (x < width - 1 && visited[p + 1]) touches = true
    else if (y > 0 && visited[p - width]) touches = true
    else if (y < height - 1 && visited[p + width]) touches = true
    if (!touches) continue
    const whiteness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
    const ratio = Math.max(0, Math.min(1, (whiteness - T_SOFT) / (T_HARD - T_SOFT)))
    data[idx + 3] = Math.round(255 * (1 - ratio))
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath)
}

;(async () => {
  const targets = process.argv.slice(2)
  if (targets.length === 0) {
    console.error('usage: node transparify.cjs <file.png> [...]')
    process.exit(1)
  }
  for (const path of targets) {
    const tmp = path + '.tmp'
    await transparify(path, tmp)
    fs.renameSync(tmp, path)
    console.log('done:', path)
  }
})()
