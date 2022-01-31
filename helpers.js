import { createWriteStream } from "fs"
import { writeFile, readFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const saveFile = async (name, data) => {
    const savePath = join(__dirname, "adobelocalfont", name)
    await mkdir(dirname(savePath), { recursive: true })
    await writeFile(
        savePath,
        data,
        { encoding: "utf-8" }
    );
    return savePath
}

export const saveStream = (name) => {
    const savePath = join(__dirname, "adobelocalfont", name)
    return createWriteStream(savePath)
}

export const getFile = async (name) => {
    const savePath = join(__dirname, "adobelocalfont", name)
    try {
        const savedFile = await readFile(savePath, { encoding: "utf-8" })
        return savedFile;
    } catch (err) {
        return null
    }
}
