const BASE_URL = "https://api.redgifs.com"

let rgToken = null
let rgSlides = []
let rgPage = 1
let rgDone = false
let rgIsLoading = false
let rgSearchText = ""
let rgOrder = "trending"
let lastFetchTime = 0

// form element refs — set by initRedgifs()
let rgTagsInput, rgOrderSelect, rgErrorElem

function showError(msg) {
    if (!rgErrorElem) return
    rgErrorElem.textContent = msg
    rgErrorElem.style.display = msg ? 'block' : 'none'
}

async function fetchToken() {
    // Temporary tokens are anonymous — no account needed.
    // Note: api.redgifs.com CORS support for browser fetch() is unconfirmed.
    // A TypeError ("Failed to fetch") here indicates a CORS block.
    const response = await fetch(BASE_URL + "/v2/auth/temporary")
    const json = await response.json()
    rgToken = json.token
}

export async function startRedgifs() {
    showError("")
    const userTags = rgTagsInput.value.trim()
    if (userTags === "") return false

    rgSearchText = userTags
    rgOrder = rgOrderSelect.value
    rgSlides = []
    rgPage = 1
    rgDone = false
    rgIsLoading = false
    lastFetchTime = 0

    try {
        await fetchToken()
    } catch (e) {
        if (e instanceof TypeError) {
            showError("Could not connect to RedGifs. This may be a CORS restriction — try opening the app via a local server rather than file://")
        } else {
            showError("RedGifs auth failed: " + e.message)
        }
        return false
    }

    await loadNextPage()
    return rgSlides.length > 0
}

async function loadNextPage() {
    if (rgDone || rgIsLoading) return
    rgIsLoading = true

    const elapsed = Date.now() - lastFetchTime
    if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed))

    const url = BASE_URL + "/v2/gifs/search"
        + "?tags=" + encodeURIComponent(rgSearchText)
        + "&order=" + rgOrder
        + "&count=40"
        + "&page=" + rgPage

    try {
        lastFetchTime = Date.now()
        const response = await fetch(url, {
            headers: { "Authorization": "Bearer " + rgToken }
        })

        // Token expired — refresh and retry once
        if (response.status === 401) {
            await fetchToken()
            rgIsLoading = false
            await loadNextPage()
            return
        }

        const json = await response.json()
        const gifs = json.gifs

        if (!gifs || gifs.length === 0) {
            rgDone = true
            rgIsLoading = false
            showError("No results found for these tags.")
            return
        }

        rgPage++

        for (const gif of gifs) {
            if (!gif.id || !gif.width || !gif.height) continue
            rgSlides.push({
                type: "iframe",
                html: `<iframe src="https://www.redgifs.com/ifr/${gif.id}" frameborder="0" scrolling="no" allowfullscreen allow="autoplay;fullscreen"></iframe>`,
                width: gif.width,
                height: gif.height
            })
        }
    } catch (e) {
        console.error("RedGifs fetch error:", e)
        if (e instanceof TypeError) {
            showError("Could not connect to RedGifs. This may be a CORS restriction — try opening the app via a local server rather than file://")
        } else {
            showError("RedGifs request failed: " + e.message)
        }
    }

    rgIsLoading = false
}

function scaleWidth(fitHeight, height, width) {
    return width * (fitHeight / height)
}

export async function nextRedgifsSlides(remainingWidth, height, isEmpty) {
    if (rgSlides.length === 0) return []
    if (rgSlides.length < 10) loadNextPage()

    const toAdd = []
    let newRemainingWidth = remainingWidth

    while (newRemainingWidth > 50) {
        if (rgSlides.length === 0) break

        let picked = false
        for (let i = 0; i < rgSlides.length && i < 10; i++) {
            const scaledWidth = scaleWidth(height, rgSlides[i].height, rgSlides[i].width)
            if (scaledWidth < newRemainingWidth) {
                const slide = rgSlides.splice(i, 1)[0]
                slide.scaledWidth = scaledWidth
                toAdd.push(slide)
                newRemainingWidth -= scaledWidth
                picked = true
                break
            }
        }

        if (!picked) {
            if (isEmpty) {
                const scaledHeight = scaleWidth(newRemainingWidth, rgSlides[0].width, rgSlides[0].height)
                const scaledWidth = scaleWidth(scaledHeight, rgSlides[0].height, rgSlides[0].width)
                const slide = rgSlides.splice(0, 1)[0]
                slide.scaledWidth = scaledWidth
                toAdd.push(slide)
                newRemainingWidth = 0
            }
            break
        }
    }

    return toAdd
}

export function initRedgifs() {
    rgErrorElem = document.getElementById("redgifsError")
    rgTagsInput = document.getElementById("rgTags")
    rgOrderSelect = document.getElementById("rgOrder")

    rgTagsInput.onkeydown = (e) => {
        if (e.code === "Enter") document.getElementById("redgifsSubmit").click()
    }
}
