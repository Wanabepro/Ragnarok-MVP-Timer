const activeMvps = {}

//_________STATE MANAGEMENT____________

function fetchMvpList(callback) {
    fetch('./mvp_list.JSON')
        .then((response) => response.json())
        .then(mvpList => callback(mvpList))
}

function generateOptionsForMvpList(mvpList) {
    mvpList.sort()

    let mvpListOptions = document.getElementById('MVP_List').options

    mvpList.forEach(mvp => {
        mvpListOptions[mvpListOptions.length] = new Option(mvp.name, JSON.stringify(mvp), true)
    })
}

function removeActiveMvp(id) {
    clearInterval(activeMvps[id].timerId)
    delete activeMvps[id]
}

function addActiveMvp(mvp) {
    if (Object.keys(mvp).length !== 0 && activeMvps[mvp.id] === undefined) {
        activeMvps[mvp.id] = {}
        activeMvps[mvp.id].cdr = createDateFromMs(mvp.respawn[0].cdr)
        activeMvps[mvp.id].startTime = createStartTime()
        activeMvps[mvp.id].realCdr = createDateFromMs(choseCdr(mvp))
        activeMvps[mvp.id].endTime = createEndTime(activeMvps[mvp.id].startTime, activeMvps[mvp.id].realCdr)
        activeMvps[mvp.id].timeLeft = createDateFromMs(activeMvps[mvp.id].endTime - new Date())
        activeMvps[mvp.id].timerId = setInterval(timerHandlerCreator(mvp.id), 1000)
        activeMvps[mvp.id].X = getX() || 0
        activeMvps[mvp.id].Y = getY() || 0
        activeMvps[mvp.id].name = mvp.name
        activeMvps[mvp.id].map = mvp.respawn[0].map
    }
}



function createStartTime() {
    if (document.getElementById('DifferentTimeZone').value === '') {
        return new Date()
    } else {
        let field = document.getElementById('DifferentTimeZone').value.split(':').map(el => Number(el))

        let result = new Date()
        result.setHours(field[0])
        result.setMinutes(field[1])

        return result
    }
}

function createDateFromMs(ms) {
    let time = new Date(ms)

    time.setHours(time.getHours() + time.getTimezoneOffset() / 60)

    return time
}

function choseCdr(mvp) {
    if (document.getElementById('DifferentTimeToRespawn').value === '') {
        return mvp.respawn[0].cdr
    } else {
        const newCdr = document.getElementById('DifferentTimeToRespawn').value.split(':').map(el => Number(el))
        return ((newCdr[0] * 60 * 60 + newCdr[1] * 60) * 1000)
    }
}

function createEndTime(startTime, cdr) {
    let result = new Date(startTime)
    result.setSeconds(result.getSeconds() + cdr.getSeconds())
    result.setMinutes(result.getMinutes() + cdr.getMinutes())
    result.setHours(result.getHours() + cdr.getHours())

    return result
}



function getX() {
    return Number(document.getElementById('X').value)
}

function getY() {
    return Number(document.getElementById('Y').value)
}

//_________HANDLERS____________________
function onAddNewMvp() {
    const mvp = JSON.parse(document.getElementById('MVP_List').value === 'Выбор MVP'
        ? '{}'
        : document.getElementById('MVP_List').value)

    if (activeMvps[mvp.id] === undefined) {
        addActiveMvp(mvp)
        removeInnerHTML('MvpsInTable')
        renderActiveMvpsList()
        clearFields()
    }

}

function onRemoveMvp() {
    const mvpId = this.id.split('_')[0]

    clearInterval(activeMvps[mvpId].timerId)
    delete activeMvps[mvpId]

    removeInnerHTML('MvpsInTable')
    renderActiveMvpsList()
}

function timerHandlerCreator(id) {
    return function timerHandler() {
        activeMvps[id].timeLeft.setSeconds(activeMvps[id].timeLeft.getSeconds() - 1)

        renderTimer(id)
    }
}

function onReloadTimer() {
    const mvpId = this.id.split('_')[0]

    clearInterval(activeMvps[mvpId].timerId)

    activeMvps[mvpId].startTime = createStartTime()
    activeMvps[mvpId].realCdr = new Date(activeMvps[mvpId].cdr)
    activeMvps[mvpId].endTime = createEndTime(activeMvps[mvpId].startTime, activeMvps[mvpId].cdr)
    activeMvps[mvpId].timeLeft = createDateFromMs(activeMvps[mvpId].endTime - new Date())

    activeMvps[mvpId].timerId = setInterval(timerHandlerCreator(mvpId), 1000)

    removeInnerHTML('MvpsInTable')
    renderActiveMvpsList()
}

function onMapClick(event) {
    document.getElementById('modalWindowContainer').style = 'display: flex;'

    const targetMap = this.id.split('-')[1]

    const mapImg = document.createElement('img')
    mapImg.src = `https://www.divine-pride.net/img/map/original/${targetMap}`
    mapImg.alt = `${targetMap} map`

    document.getElementById('modalWindowMap').appendChild(mapImg)
}

function onAccept() {
    document.getElementById('modalWindowContainer').style = 'display: none;'

    const mapImgParent = this.parentNode.previousElementSibling
    mapImgParent.removeChild(mapImgParent.lastChild)
}

function onRefuse() {
    document.getElementById('modalWindowContainer').style = 'display: none;'

    const mapImgParent = this.parentNode.previousElementSibling
    mapImgParent.removeChild(mapImgParent.lastChild)
}



//_________RENDERING___________________

function renderActiveMvpsList() {
    Array.from(Object.keys(activeMvps)
        .map(activeMvpId => [activeMvpId, activeMvps[activeMvpId]]))
        .sort((activeMvp1, activeMvp2) => activeMvp1[1].timeLeft - activeMvp2[1].timeLeft)
        .forEach(activeMvp => {
            renderActiveMvp(activeMvp[0])
        })
}

function renderActiveMvp(mvpId) {
    const mvp = activeMvps[mvpId]
    const tr = document.createElement('tr')
    tr.id = mvpId

    tr.innerHTML = `
            <td>
                <img src="https://static.divine-pride.net/images/mobs/png/${mvpId}.png" alt="${mvp.name} photo" />
            </td>
            <td>${mvp.name}</td>
            <td>
                <figure id='${mvpId}-${mvp.map}-map' class='map'>
                    <img src="https://www.divine-pride.net/img/map/original/${mvp.map}" alt="${mvp.map} map" />
                    <div class='dot' id='${mvpId}dot'></div>
                </figure>
                <p>@warp ${mvp.map}</p>
                <p>(${activeMvps[mvpId].X} ; ${activeMvps[mvpId].Y})</p>
            </td>
            <td id='${mvpId}moment'>${renderTimeString(activeMvps[mvpId].endTime)}</td>
            <td id='${mvpId}timer'></td>
            ${reloadIconStringCreator(mvpId)}
            ${removeIconStringCreator(mvpId)}
    `
    document.getElementById('MvpsInTable').append(tr)
    moveDot(activeMvps[mvpId].X, activeMvps[mvpId].Y, mvpId)
    document.getElementById(`${mvpId}_reloadButton`).addEventListener('click', onReloadTimer)
    document.getElementById(`${mvpId}_removeButton`).addEventListener('click', onRemoveMvp)
    document.getElementById(`${mvpId}-${mvp.map}-map`).addEventListener('click', onMapClick)
}

function renderTimer(mvpId) {
    document.getElementById(`${mvpId}timer`).innerHTML = renderTimeString(activeMvps[mvpId].timeLeft)
}

function renderTimeString(time) {

    return `${time.getHours() < 10 ? '0' : ''}${time.getHours()}
        : ${time.getMinutes() < 10 ? '0' : ''}${time.getMinutes()}
        : ${time.getSeconds() < 10 ? '0' : ''}${time.getSeconds()}`
}

//________HELPERS_____________________

function removeInnerHTML(id) {
    const myNode = document.getElementById(id);
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}

function clearFields() {
    document.getElementById('MVP_List').value = 'Выбор MVP'
    document.getElementById('X').value = ''
    document.getElementById('Y').value = ''
    document.getElementById('DifferentTimeZone').value = ''
    document.getElementById('DifferentTimeToRespawn').value = ''
}

function reloadIconStringCreator(id) {
    return `<svg class='reload' id='${id}_reloadButton' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>`
}

function removeIconStringCreator(id) {
    return `<svg class='remove' id='${id}_removeButton' xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
        <title>Trash</title>
        <path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
        <path stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/><path d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
    </svg>`
}

function moveDot(x, y, mvpId) {
    document.getElementById(`${mvpId}dot`).style.left = `${x / 2}px`
    document.getElementById(`${mvpId}dot`).style.bottom = `${y / 2}px`
}

//_______MAIN SCRIPT__________________

fetchMvpList(generateOptionsForMvpList)

document.getElementById('mainBtn').addEventListener('click', onAddNewMvp)
document.getElementById('modalWindowButtonAccept').addEventListener('click', onAccept)
document.getElementById('modalWindowButtonRefuse').addEventListener('click', onRefuse)