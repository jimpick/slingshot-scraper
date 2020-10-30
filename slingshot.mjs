import fs from 'fs'
import puppeteer from 'puppeteer'
import fullPageScreenshot from 'puppeteer-full-page-screenshot'
import delay from 'delay'
;(async () => {
  const browser = await puppeteer.launch()
  // const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  let count = 0
  const projects = []
  for (let pageNumber = 1; pageNumber <= 6; pageNumber++) {
    await page.goto(`https://slingshot.filecoin.io/?page=${pageNumber}`)
    const selector = '.ranking-table-container > table tbody tr'
    await page.waitForSelector(selector)
    const projectElements = await page.$$(selector)
    // projectElements.length = 2
    for (const elementHandle of projectElements) {
      console.log('Entry', ++count)
      const rankElHandle = await elementHandle.$('.rank')
      if (!rankElHandle) {
        console.log('Missing rank\n')
        continue
      }
      const rank = Number(
        await rankElHandle.evaluate(node =>
          node.textContent.replace(/\n/g, '').trim()
        )
      )
      const nameElHandle = await elementHandle.$('.name-tag')
      if (!nameElHandle) {
        console.log('Missing name\n')
        continue
      }
      const name = await nameElHandle.evaluate(node =>
        node.textContent.replace(/\n/g, '').trim()
      )
      if (isNaN(rank)) continue
      const project = {
        name,
        rank,
        indexUrl: page.url()
      }
      // console.log('Element:', await elementHandle.evaluate(node => node.outerHTML))
      await elementHandle.evaluate(node => node.scrollTo())
      await Promise.all([
        page.waitForNavigation(),
        elementHandle.evaluate(node => node.click())
      ])
      project.url = page.url()
      project.addresses = []
      console.log('URL', project.url)
      await page.waitForSelector('.project-table-container td.address a')
      const addressElements = await page.$$(
        '.project-table-container td.address a'
      )
      for (const addressEl of addressElements) {
        const hrefProp = await addressEl.getProperty('href')
        const href = await hrefProp.jsonValue()
        const match = href.match(/address=(.*)/)
        if (match) {
          const address = match[1]
          // console.log('Jim address', address)
          project.addresses.push(address)
        }
      }
      await Promise.all([page.waitForNavigation(), page.goBack()])
      projects.push(project)
      console.log(project)
      console.log()
      // await delay(1 * 1000)
    }
  }
  console.log(projects)
  fs.writeFileSync('slingshot-teams.json', JSON.stringify(projects, null, 2))

  await browser.close()
})()
