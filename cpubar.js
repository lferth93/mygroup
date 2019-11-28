exports.setData = async function (bar, users) {
    var data = { titles: [], data: [] }
    for (let user of users) {
        data.titles.push(user.name)
        data.data.push(Math.round(user.cpu))
    }
    bar.setData(data)
}