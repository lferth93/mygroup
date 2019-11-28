exports.setData = async function (stack, users) {
    var data = {
        stackedCategory: ['COMPLETED', 'CANCELLED', 'TIMEOUT', 'FAILED'],
        barCategory: [], data: []
    }
    for (let user of users) {
        data.barCategory.push(user.name)
        data.data.push([user.COMPLETED, user.CANCELLED, user.TIMEOUT, user.FAILED])
    }
    stack.setData(data)
}