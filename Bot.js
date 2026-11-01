const Mineflayer = require('mineflayer')
const Vec3 = require('vec3').Vec3
const { createPlugin, goals, NoPathError } = require('./Pathfinder')
const { JumpCalculator } = require('./Pathfinder/dist/mineflayer-specific/movements/movementUtils')
const { validateLocaleAndSetLanguage, isConstructorDeclaration } = require('typescript')
const { completePath } = require('@miner-org/mineflayer-baritone/src/utils')

const Bot = Mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: '26.1'
})

Bot.loadPlugin(createPlugin())

const mossyBlocksNames = [
    'stone',
    'granite',
    'diorite',
    'andesite',
    'tuff',
    'deepslate',

    'dirt',
    'grass_block',
    'podzol',
    'coarse_dirt',
    'mycelium',
    'rooted_dirt',
    'mud',
    'muddy_mangrove_roots',
    'pale_moss_block',

    'cave_vines',
    'cave_vines_plant',

    'cobblestone'
]

const airBlocksNames = ['air', 'void_air', 'cave_air']

function getIDs(Names) {
    let blocksIDs = []
    for (const Name of Names) {
        blocksIDs.push(Bot.registry.blocksByName[Name].id)
    }
    return blocksIDs
}

function getPerimeter(Block) {
    const Position = Block.position
    const Numbers = [0, 1, -1, 2, -2]
    const Blocks = []
    const Positions = []

    for (const Num1 of Numbers) {
        for (const Num2 of Numbers) {
            if (Num1 == Num2 && Num1 == 0) continue
            Positions.push(new Vec3(Num1, 0, Num2))
            Positions.push(new Vec3(Num1, -1, Num2))
        }
    }

    //console.log(Positions)

    for (const Pos of Positions) {
        Blocks.push(Bot.blockAt(Position.plus(Pos)))
    }
    return Blocks
}

async function waitForTicks(Ticks) {
    if (Ticks <= 0) return
    await new Promise((resolve, reject) => {

        setTimeout(() => {
            resolve()
        }, Ticks * 50)

        const Timeout = setTimeout(() => {
            reject(new Error(`Timeout waiting FOR ${Ticks} TICKS! After ${(Ticks * 50 + 2500)} Millisecons`))
        }, Ticks * 50 + 2500) // 50ms per tick + 2.5s buffer


    })
}

const mossyBlocksIDs = getIDs(mossyBlocksNames)
const airBlocksIDs = getIDs(airBlocksNames)
const mossBlockID = Bot.registry.blocksByName['moss_block'].id

async function Run() {
    await Bot.waitForChunksToLoad()

    // List of Blocks IDs that can be transformed in Moss / And other useful Blocks IDs
    const Location = Bot.entity.position
    console.log(Location)
    const Range = 8
    const fillPercent = 75 / 100
    const currentMoss = []

    console.log("Start")

    for (let X = Location.x - Range; X <= Location.x + Range; X++) {
        for (let Y = Location.y - Range; Y <= Location.y + Range; Y++) {
            for (let Z = Location.z - Range; Z <= Location.z + Range; Z++) {
                const Block = Bot.blockAt(new Vec3(X, Y, Z))
                const blockUp = Bot.blockAt(new Vec3(X, Y + 1, Z))
                const Perimeter = getPerimeter(Block)
                if (mossyBlocksIDs.includes(Block.type)) {
                    if (airBlocksIDs.includes(blockUp.type)) {
                        for (const perimeterBlock of Perimeter) {
                            if (perimeterBlock.type == mossBlockID) {
                                const mossBlockUp = Bot.blockAt(perimeterBlock.position.offset(0, 1, 0))
                                if (airBlocksIDs.includes(mossBlockUp.type)) {

                                    // Controlla che nessun Blocco abbia la posizione uguale al blocco che si vuole Inserire
                                    // Some si assciura che l'espressione sia verificata per ogni elemento della Lista
                                    Result = currentMoss.find((Block) => {
                                        if (Block.Block.position.equals(perimeterBlock.position)) {
                                            return true
                                        }
                                    })
                                    if (Result == undefined) {
                                        currentMoss.push({ "Block": perimeterBlock, "Times": 1 })
                                        //console.log("Non c'erano blocchi qui: " + perimeterBlock.position)
                                    } else {
                                        Result.Times += 1
                                        //console.log("C'erano blocchi qui: " + perimeterBlock.position + " Counter: " + Result.Times)
                                    }

                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log("Lenght: " + currentMoss.length)

    for (Target of currentMoss) {
        console.log('Position: ' + Target.Block.position)
        console.log('Number: ' + Target.Times)
    }
}

async function Fly(User, Msg) {
    if (User == 'elonMuschio' && Msg == 'Fly') {
        const Inventory = Bot.inventory
        const elytraType = Bot.registry.itemsByName['elytra'].id
        const GGs = Bot.inventory.findInventoryItem(elytraType)
        if (GGs != null) {
            console.log(typeof GGs)
            Bot.equip(GGs, 'torso')
        }
        await waitForTicks(2)
        Bot.setControlState('jump', true)
        await waitForTicks(2)
        Bot.setControlState('jump', false)
        await waitForTicks(2)
        await Elytra()
        Bot.physicsEnabled = false
        Bot.entity.position = Bot.entity.position.abs()

        Square()
    }
}

Bot.once('spawn', Run)
Bot.on('chat', Fly)

Bot.on('kicked', (Res) => {
    console.log(Res)
})

async function Elytra() {
    if (!Bot.entity.elytraFlying)
        Bot._client.write('entity_action', {
            entityId: Bot.entity.id,
            actionId: Bot.supportFeature('entityActionUsesStringMapper') ? 'start_elytra_flying' : 6
        })
    await waitForTicks(8)
}

async function Square() {
    for (let a = 0; a < 4; a++) {
        const Vectors = [
            new Vec3(-1, 0, 0),
            new Vec3(0, 0, -1),
            new Vec3(1, 0, 0),
            new Vec3(0, 0, 1)
        ]
        Bot.look(90 * a, 0)
        for (let b = 0; b < 10; b++) {
            Bot.entity.position.add(Vectors[a])
            await waitForTicks(4)
        }
    }
}

async function ElytraTo(Point) {
    isValid()
}

function getDirection(Point) {
    Coords = Bot.entity.position
    DeltaZ = Point.z - Coords.z
    DeltaY = Point.y - Coords.y
    DeltaX = Point.x - Coords.x

}

function isValid(Block) {
    if (airBlocksIDs.includes(Bot.blockAt(Block).type)) {
        return true
    }
    return false
}