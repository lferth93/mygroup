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
Uso
    $ mygroup.simg 

Opciones
    --days n, -d n      El programa mostrara los datos de los ultimos n dias (por defecto n=30). 
    --help, -h          Mostrar este mensaje de ayuda.

Ejemplos
    $ mygroup.simg --d 20
    $ mygroup.simg
`, {
        flags: {
            days:{
                type:'number',
                alias:'d',
                default: 30,
                isMultiple: false
            }
        }
    });

    if (cli.flags.help){
        cli.showHelp()
        process.exit()
    }

    if (typeof SLURMDB == 'undefined' || SLURMDB == null){
    	console.log("ERROR: No hay una base de datos de Slurm establecida.")
	    process.exit()
    }

    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit()
    })

    var grid = new contrib.grid({ rows: 2, cols: 3, screen: screen })

    var table = grid.set(0, 0, 2, 1, contrib.table, {
        fg: 'white'
        , label: 'Grupo:'+ cli.input[0] +' Total de jobs'
        , keys: true
        , interactive: true
        , selectedFg: 'white'
        , selectedBg: 'blue'
        , interactive: true
        , width: '100%'
        , height: '100%'
        , border: { type: "line", fg: "cyan" }
        , columnSpacing: 2 //in chars
        , columnWidth:[8,6,5,5,5,5]
    })
    var cpuBar = grid.set(0, 1, 1, 2, contrib.bar, {
        label: 'Horas de CPU por usuario'
        , barWidth: 8
        , barSpacing: 6
        , xOffset: 0
        , maxHeight: 10
    })
    var stateStack = grid.set(1, 1, 1, 2, contrib.stackedBar, {
        label: 'Jobs por estado'
        , barWidth: 8
        , barSpacing: 2
        , xOffset: 0
        , height: "100%"
        , width: "100%"
        , barBgColor: ['green', 'blue', 'yellow', 'red']
    })

    blessed.text({
        parent:screen,
        left:0,
        bottom:0,
        content:'Esc, q, Ctr-c para salir.',
    })

    let users = await getData(cli.input[0],cli.flags.days)
    cpubar.setData(cpuBar, users)
    statestack.setData(stateStack, users)
    setTable(table, users)
    
    screen.on('resize', function () {
        cpuBar.emit('attach');
        cpubar.setData(cpuBar, users)
        stateStack.emit('attach')
        statestack.setData(stateStack, users)
    });
    table.focus()
    screen.render()
}

async function getData(user, days) {
    if (user != null) {
        query.query.bool.must = [{ term: { "groupname.keyword": user } }]
    }
    var now = new Date().getTime()
    var mbefore = now - (86400000 * days)

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
    let data = {headers:['User','Total','COMP','CANC','TIME','FAIL'],data:[]}
    for (let user of users) {
        data.data.push([
            user.name,
            user.total,
            user.COMPLETED,
            user.CANCELLED,
            user.TIMEOUT,
            user.FAILED
        ])
    }
    table.setData(data)
}
