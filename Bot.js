const Mineflayer = require('mineflayer')
const Vec3 = require('vec3').Vec3

const Bot = Mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: '26.1'
})

Bot.on('chat', Fly)
Bot.on('chat', Test)

Bot.on('kicked', (Res) => {
})

//--------------------//

//Creates the logger to set specific colors
const logger = require('node-color-log');
const Delay = 0
const flyDelay = 3

//State for the flyElytra
let flyState = false

// Valori per la media ponderata fra la distanza dal blocco di Muschio e il Numero di blocchi che Converte
const distanceImp = 0.65
const rangeImp = 0.35

//Area that the bot Scans
const Range = 8
const fillPercent = 75 / 100

const airBlocksNames = ['air', 'void_air', 'cave_air']

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

    'cobblestone' // Temporaneo
]

// List of Blocks IDs that can be transformed in Moss / And other Blocks IDs
const mossyBlocksIDs = getIDs(mossyBlocksNames)
const airBlocksIDs = getIDs(airBlocksNames)
const mossBlockID = getBlockID('moss_block')

function getIDs(Names) {
    let blocksIDs = []
    for (const Name of Names) {
        blocksIDs.push(Bot.registry.blocksByName[Name].id)
    }
    return blocksIDs
}

function getItemID(Name) {
    const Item = Bot.registry.itemsByName[Name]
    if (Item != undefined) {
        return Item.id
    }
    return undefined
}

function getBlockID(Name) {
    const Block = Bot.registry.blocksByName[Name]
    if (Block != undefined) {
        return Block.id
    }
    return undefined
}

//TODO: Change the Actual range of Moss with the real sprading table from the Wiki with a ponderate media of the value
function getPerimeter(Block) {
    const Position = Block.position
    const Numbers = [0, 1, -1, 2, -2]
    const Blocks = []

    for (const Num1 of Numbers) {
        for (const Num2 of Numbers) {
            if (Num1 == Num2 && Num1 == 0) continue
            Blocks.push(
                Bot.blockAt(Position.plus(new Vec3(Num1, 0, Num2)))
            )
            Blocks.push(
                Bot.blockAt(Position.plus(new Vec3(Num1, 1, Num2)))
            )
        }
    }
    return Blocks
}


// Just a delay that works with no Physics (Palle)
async function waitForTicks(Ticks) {
    if (Ticks <= 0) return
    await new Promise((resolve, reject) => {

        setTimeout(() => {
            resolve()
        }, Ticks * 50)
    })
}


function getItem(Name) {
    Inv = Bot.inventory.slots
    if (Inv != null)
        for (Slot of Inv) {
            if (Slot != null) {
                if (Slot.type == getItemID(Name)) {
                    return Slot
                }
            }
        }
    return null
}


// Reafctor the Times count with the real Moss spread Mecanic
async function Search() {
    await Bot.waitForChunksToLoad()

    const Location = Bot.entity.position.floored()

    let toBonemeal = []

    for (let X = Location.x - Range; X <= Location.x + Range; X++) {
        for (let Y = Location.y - Range; Y <= Location.y + Range; Y++) {
            for (let Z = Location.z - Range; Z <= Location.z + Range; Z++) {
                const Block = Bot.blockAt(new Vec3(X, Y, Z))
                if (Block.type == mossBlockID) {
                    const blockUp = Bot.blockAt(new Vec3(X, Y + 1, Z))
                    if (airBlocksIDs.includes(blockUp.type)) {
                        const Perimeter = getPerimeter(Block)
                        let toConvert = 0
                        for (const perimeterBlock of Perimeter) {
                            if (mossyBlocksIDs.includes(perimeterBlock.type)) {
                                const perimeterBlockUp = Bot.blockAt(perimeterBlock.position.offset(0, 1, 0))
                                if (airBlocksIDs.includes(perimeterBlockUp.type)) {
                                    toConvert++
                                }
                            }
                        }
                        toBonemeal.push({ "Block": Block, "Times": toConvert })
                        toConvert = 0
                    }
                }
            }
        }
    }
    if (toBonemeal.length > 0) {
        toBonemeal.sort((A, B) => {
            // Perche deve restituire un numero negativo se A < B e positivo se A > B
            return A.Times - B.Times
        })
        toBonemeal.reverse()
        return toBonemeal[0].Block
    }
    return undefined
}

// Mario vola nessuno sa come Lol :)

async function Fly(User, Msg) {
    if (User == 'elonMuschio' && Msg == 'Fly') {
        const elytra = getItem('elytra')
        if (elytra != null) {
            await Bot.equip(elytra, 'torso')
        } else {
            logger.color('red').bold().log('No elytra in the Inv')
            return
        }
        await flyElytra(true)
        let Moss = await Search()
        if (Moss != undefined) {
            await elytraTo(Moss.position.offset(0, 1, 0))
            //await Bonemeal(Moss)
        }
    }
}

async function Test(User, Msg) {
    if (User == 'elonMuschio' && (Msg == 'Test' || Msg == 'T')) {
        await flyElytra()
    }
}

function isFilled() {
    return false
}

async function Bonemeal(Block) {
    Bot.activateItem()
}

// Jump and opens the Elytra
async function flyElytra() {
    if (!Bot.entity.elytraFlying) {
        await equipElytra()
        await Jump()
        fallFlying()
        Bot.physicsEnabled = false
    }
}

//TODO: Check the elytra Durability
async function equipElytra() {
    const elytra = getItem('elytra')
    if (elytra != null) {
        await Bot.equip(elytra, 'torso')
    } else {
        logger.color('red').bold().log('No elytra in the Inv')
        return
    }
}

function fallFlying() {
    //Pachetti devono essere completi vedere mappings nel file protocol.json tutti i campi!
    //node_modules/minecraft-data/minecraft-data/data/pc/26.1/protocol.json:10479
    Bot._client.write('entity_action', {
        entityId: Bot.entity.id,
        actionId: 'start_fall_flying',
        jumpBoost: 0
    })
}

async function Jump() {
    Bot.physicsEnabled = true
    Bot.entity.onGround = true
    Bot.setControlState('jump', true)
    await waitForTicks(1)
    Bot.setControlState('jump', false)
}

// Mario vola in un quadrato perchè è SCHEMO :(

async function Square() {
    const Vectors = [
        new Vec3(-1, 0, 0),
        new Vec3(0, 0, -1),
        new Vec3(1, 0, 0),
        new Vec3(0, 0, 1)
    ]
    for (let Angle = 0; Angle < 4; Angle++) {
        for (let Step = 0; Step < 10; Step++) {
            Bot.entity.position.add(Vectors[Angle])
            await waitForTicks(flyDelay)
        }
    }
}

// Elytra path Finding ¸.·´¯`·.¸.·´¯`·.¸.·´¯`·.¸.·´¯`·.¸.·´¯`·.¸.·´¯`·.¸.·´¯`·.¸ //

async function getPath(Point, Radius) {
    const Positions = [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, -1, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1)
    ]

    let Pos = Bot.entity.position

    const First = {
        // Floored and not clone() + round() perche round lo fa per eccesso
        "Position": Pos.floored(),
        "Parent": undefined
    }
    let Queue = []
    let Explored = new Set()
    Queue.push(First)

    for (let Item of Queue) {
        if (Item.Position.equals(Point)) {
            const Coords = []

            let Current = Item
            while (Current != undefined) {
                Coords.push(Current.Position)
                Current = Current.Parent
            }
            return Coords
        }

        for (const Position of Positions) {
            let nearBlockPos = Item.Position.clone().add(Position).round()

            if (isInRange(nearBlockPos, Radius) && !Explored.has(nearBlockPos.toString()) && isValidPos(nearBlockPos)) {
                Explored.add(nearBlockPos.toString())
                Queue.push({
                    "Position": nearBlockPos,
                    "Parent": Item
                })
            }
            await waitForTicks(Delay)
        }
        await waitForTicks(Delay)
    }

    return []
}


async function executePath(Path) {
    for (let Pos of Path.reverse()) {
        await botMove(Pos)
    }
}

// Temporany
async function botMove(Pos) {
    // Asse Y messo 0.25 perche la hitbox è alta 0.6
    // 0.1 tocca per terra per qualche Motivo
    Bot.entity.position = Pos.offset(0.5, 0.25, 0.5)
    await waitForTicks(flyDelay)
}


async function elytraTo(Point) {
    const Path = await getPath(Point, 16)
    await executePath(Path)
}

//TODO: Check/Refactor

function isValidPos(Point) {
    const Block = Bot.blockAt(Point)
    if (airBlocksIDs.includes(Block.type)) {
        return true
    }
    return false
}

function isInRange(Point, Range) {
    const Pos = Bot.entity.position.floored()
    const plusPos = Pos.offset(Range, Range, Range)
    const minusPos = Pos.offset(-Range, -Range, -Range)
    let rangeX = Point.x >= minusPos.x && Point.x <= plusPos.x
    let rangeY = Point.y >= minusPos.y && Point.y <= plusPos.y
    let rangeZ = Point.z >= minusPos.z && Point.z <= plusPos.z
    if (rangeX && rangeY && rangeZ) {
        return true
    }
    return false
}

// Mi annoio

/*
                \||/
                |  @___oo
      /\  /\   / (__,,,,|
     ) /^\) ^\/ _)
     )   /^\/   _)
     )   _ /  / _)
 /\  )/\/ ||  | )_)
<  >      |(,,) )__)
 ||      /    \)___)\
 | \____(      )___) )___
  \______(_______;;; __;;;

*/