function faviconURL(u: string) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', u) // this encodes the URL as well
  url.searchParams.set('size', '32')
  return url.toString()
}

{
const imageOverlay = document.createElement('img')
imageOverlay.src = faviconURL('https://www.google.com')
imageOverlay.alt = "Google's favicon"
imageOverlay.classList.add('favicon-overlay')
document.body.appendChild(imageOverlay)
}

{
const imageOverlay = document.createElement('img')
imageOverlay.src = faviconURL('https://github.com')
imageOverlay.alt = "github's favicon"
imageOverlay.classList.add('favicon-overlay')
document.body.appendChild(imageOverlay)
}

{
const imageOverlay = document.createElement('img')
imageOverlay.src = faviconURL('https://www.youtube.com')
imageOverlay.alt = "youtube's favicon"
imageOverlay.classList.add('favicon-overlay')
document.body.appendChild(imageOverlay)
}