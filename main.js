import fetch from "node-fetch"
import { getFile, saveFile, saveStream } from "./helpers.js";
import { dirname } from "path"
import { config } from "dotenv"
config()

const projectId = process.env.projectId

const FONTMAP = {
    woff: "woff",
    woff2: "woff2",
    opentype: "otf"
}

const getProjectCss = async (projectId) => {
    const cssFile = await getFile(`${projectId}.original.css`)
    if (cssFile) {
        return cssFile
    }

    const typekitCss = `https://use.typekit.net/${projectId}.css`

    const response = await fetch(typekitCss)
    const css = await response.text()

    const savedCss = await saveFile(`${projectId}.original.css`, css);
    if (savedCss) {
        return css;
    }
}

const getFontFaceInformation = (fontFace) => {
    const family = fontFace.match(/font-family:"(.*)";/)?.[1];
    const style = fontFace.match(/font-style:(\w*);/)?.[1];
    const weight = fontFace.match(/font-weight:(.*);/)?.[1];
    const src = fontFace.match(/src:(.*);/)?.[1];
    const srcObject = src.split(/,/).map(u => {
        const uObject = u.match((/url\("(.*)"\) format\("(.*)"\)/))
        return {
            originalUrl: uObject[1],
            format: uObject[2],
        }
    })
    return {
        family,
        style,
        weight,
        srcObject,
    }
}

const downloadFonts = async (css, fontFaceInformations, projectId) => {
    var localCss = css;
    for (var fontFace of fontFaceInformations) {
        const newName = `${fontFace.family}-${fontFace.style}-${fontFace.weight}`
        for (var src of fontFace.srcObject) {
            const formatEnding = FONTMAP[src.format]
            const fontRequest = await fetch(src.originalUrl)
            fontRequest.body.pipe(saveStream(`${newName}.${formatEnding}`))
            localCss = localCss.replace(
                src.originalUrl,
                `${newName}.${formatEnding}`
            )
        }
    }
    return localCss;
}

console.log(`Downloading CSS for Project "${projectId}"`)

const css = await getProjectCss(projectId)

const fontFaces = css.split('\n\n').filter(block => /@font-face \{/.test(block))

const fontFacesWithInformation = fontFaces.map(ff => getFontFaceInformation(ff))

console.log(`Downloading ${fontFacesWithInformation.length} Fonts`)

const localCss = await downloadFonts(css, fontFacesWithInformation, projectId)

console.log(`Saving adapted CSS`)

const savedLocalCss = await saveFile(`${projectId}.css`, localCss)

if (savedLocalCss) {
    console.log(`Downloading and saving succeeded!`)
    console.log(`–––––––––––––––––––––––––––––––––`)
    console.log(`To use the fonts locally, copy the Folder ${dirname(savedLocalCss)} into your project and link to the ${savedLocalCss} file instead of https://use.typekit.net/${projectId}.css.`)
}