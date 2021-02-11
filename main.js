'use strict'
var blessed = require('blessed')
    , contrib = require('blessed-contrib')
    , screen = blessed.screen()
    , fs = require('fs')
    , cpubar = require('./cpubar.js')
    , statestack = require('./statebar.js')
    , meow = require('meow')
const SLURMDB = process.env.ES_SLURM_DB
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://' + SLURMDB })
let query = JSON.parse(fs.readFileSync('query.json'))

setup().catch(console.log)

async function setup() {
    const cli = meow(`
Programa para visualizar los jobs totales por usuario y estado de un grupo.
	Usage
	  $ mygroup 

    Options
      --help, -h   Mostrar este mensaje de ayuda.

	Examples
	  $ mygroup
`, {
        flags: {
        }
    });

    if (typeof SLURMDB == 'undefined' || SLURMDB == null){
    	console.log("ERROR: No hay una base de datos establecida.")
	process.exit()
    }

    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit()
    })

    var grid = new contrib.grid({ rows: 7, cols: 1, screen: screen })
    var cpuBar = grid.set(0, 0, 3, 1, contrib.bar, {
        label: 'Grupo:' + cli.input[0] + ' Horas de CPU por usuario'
        , barWidth: 8
        , barSpacing: 6
        , xOffset: 0
        , maxHeight: 10
    })
    var stateStack = grid.set(3, 0, 3, 1, contrib.stackedBar, {
        label: 'Jobs por estado'
        , barWidth: 8
        , barSpacing: 2
        , xOffset: 0
        , height: "100%"
        , width: "100%"
        , barBgColor: ['green', 'blue', 'yellow', 'red']
    })
    let users = await getData(cli.input[0])
    //consoleconsole.error(users)
    var table = grid.set(6, 0, 1, 1, contrib.table, {
        fg: 'white'
        , selectedFg: 'white'
        , selectedBg: 'blue'
        , interactive: true
        , label: 'Total de jobs'
        , width: '100%'
        , height: '100%'
        , border: { type: "line", fg: "cyan" }
        , columnSpacing: 2 //in chars
        , columnWidth: new Array(users.length).fill(10)
    })
    cpubar.setData(cpuBar, users)
    statestack.setData(stateStack, users)
    setTable(table, users)
    
    screen.on('resize', function () {
        cpuBar.emit('attach');
        cpubar.setData(cpuBar, users)
        stateStack.emit('attach')
        statestack.setData(stateStack, users)
    });
    screen.render()

}

async function getData(user) {
    if (user != null) {
        query.query.bool.must = [{ term: { "groupname.keyword": user } }]
    }
    var now = new Date().getTime()
    var mbefore = now - 2592000000

    query.query.bool.filter[0].range = {
        "@start": {
            "gte": mbefore,
            "lte": now,
            "format": "epoch_millis"
        }
    }
    let users = []
    const { body } = await client.search({
        index: 'slurm',
        type: 'jobcomp',
        body: query
    })
    if (body.status == 400) {
        console.error(body.error)
    }

    for (let agg of body.aggregations.byUser.buckets) {
        let user = { name: agg.key, cpu: 0, TIMEOUT: 0, FAILED: 0, COMPLETED: 0, CANCELLED: 0, total: 0 }
        user.cpu = agg.cpu.value
        user.total = agg.doc_count
        for (let state of agg.byState.buckets) {
            user[state.key] = state.doc_count
        }

        users.push(user)
    }
    return users;
}

async function setTable(table, users) {
    let data = { headers: [], data: [[]] }
    for (let user of users) {
        data.headers.push(user.name)
        data.data[0].push(user.total)
    }
    table.setData(data)
}
