const Mineflayer = require('mineflayer')
const Vec3 = require('vec3').Vec3
const { createPlugin, goals, NoPathError } = require('./Pathfinder')
const { JumpCalculator } = require('./Pathfinder/dist/mineflayer-specific/movements/movementUtils')
const { validateLocaleAndSetLanguage, isConstructorDeclaration, OuterExpressionKinds } = require('typescript')
const { completePath } = require('@miner-org/mineflayer-baritone/src/utils')




const Bot = Mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: '26.1'
})

Bot.once('spawn', Run)
Bot.on('chat', Fly)

Bot.on('kicked', (Res) => {
    logger.setLevel("error")
    logger.log(Res)
})

//--------------------//

//Creates the logger to set specific colors
const logger = require('node-color-log');
const Delay = 0
const flyDelay = 4
//Area that the bot Scans
const Range = 16
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

// List of Blocks IDs that can be transformed in Moss / And other ranodm Blocks IDs for Testing
const mossyBlocksIDs = getIDs(mossyBlocksNames)
const airBlocksIDs = getIDs(airBlocksNames)
const mossBlockID = getID('moss_block')

function getIDs(Names) {
    let blocksIDs = []
    for (const Name of Names) {
        blocksIDs.push(Bot.registry.blocksByName[Name].id)
    }
    return blocksIDs
}

function getID(Name) {
    return Bot.registry.blocksByName[Name].id
}


//TODO: Refactor (The moss block should do it not every Block)
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

    for (const Pos of Positions) {
        Blocks.push(Bot.blockAt(Position.plus(Pos)))
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

        const Timeout = setTimeout(() => {
            reject(new Error(`Timeout waiting FOR ${Ticks} TICKS! After ${(Ticks * 50 + 2500)} Millisecons`))
        }, Ticks * 50 + 2500) // 50ms per tick + 2.5s buffer


    })
}


function getItem(Name) {
    Inv = Bot.inventory.slots
    if (Inv != null)
        for (Slot of Inv) {
            if (Slot != null) {
                if (Slot.type == getID(Name)) {
                    return Slot
                }
            }
        }
    return null
}

//TODO: Refactor
async function Run() {
    await Bot.waitForChunksToLoad()

    const Location = Bot.entity.position.floored()
    logger.bold().color("cyan").log("-Location :" + Location)

    const currentMoss = []

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
                                        //logger.log("Non c'erano blocchi qui: " + perimeterBlock.position)
                                    } else {
                                        Result.Times += 1
                                        //logger.log("C'erano blocchi qui: " + perimeterBlock.position + " Counter: " + Result.Times)
                                    }

                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Mario vola nessuno sa come Lol :)

async function Fly(User, Msg) {
    if (User == 'elonMuschio' && Msg == 'Fly') {
        const elytra = getItem(elytraId)
        if (elytra != null && typeof elytra !== null) {
            await Bot.equip(elytra, 'torso')
        } else {
            logger.setLevel("error")
            logger.log("No Elytra in the Inventory")
            return
        }
        await flyElytra()
        // Random Tests
        await elytraTo(Bot.entity.position.offset(16, 4, 16))
    }
}

// Jump and opens the Elytra
async function flyElytra() {
    // TODO: More accurate method to get the State
    if (!Bot.entity.elytraFlying) {
        await Jump()
        Bot._client.write('entity_action', {
            entityId: Bot.entity.id,
            actionId: Bot.supportFeature('entityActionUsesStringMapper') ? 'start_elytra_flying' : 6
        })
        Bot.physicsEnabled = false
        Bot.entity.onGround = false
    }
}

async function Jump() {
    await waitForTicks(1)
    Bot.setControlState('jump', true)
    await waitForTicks(1.5)
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
    logger.setLevel("success")
    logger.color('yellow').bold().log("getPath()...")
    const Positions = [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, -1, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1)
    ]

    let Pos = Bot.entity.position
    logger.setLevel("success")
    logger.color('magenta').log("Pos: " + Pos)

    const First = {
        // Floored and not clone() + round() perche round lo fa per eccesso
        "Position": Pos.floored(),
        "Parent": undefined
    }
    let Queue = []
    let Explored = new Set()
    Queue.push(First)

    for (let Item of Queue) {
        logger.setLevel('debug')
        logger.color('yellow').bold().log("\nElements:\n  -Queue : " + Queue.length + "\n  -Explored : " + Explored.size + "\n")
        if (Item.Position.equals(Point)) {
            logger.setLevel('success')
            logger.color('green').bold().log("Path found succesfully!")
            const Coords = []

            let Current = Item
            while (Current != undefined) {
                Coords.push(Current.Position)
                logger.setLevel('debug')
                logger.color('cyan').log("-Coords: " + Coords)
                Current = Current.Parent
            }
            return Coords
        }

        for (const Position of Positions) {
            let nearBlockPos = Item.Position.clone().add(Position).round()

            if (!Explored.has(nearBlockPos.toString()) && isValidPos(nearBlockPos) && isInRange(nearBlockPos, Radius)) {
                logger.setLevel("debug")
                logger.color('magenta').log(nearBlockPos + " Is valid Block!")
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

    if (Queue.length == 0) {
        logger.setLevel("error")
        logger.color('red').log("Path not found!")
        return []
    }

}


async function executePath(Path) {
    for (let Pos of Path.reverse()) {
        await botMove(Pos)
    }
}

// Temporany
async function botMove(Pos) {
    // Asse Y messo 0.15 perche la hitbox è alta 0.6
    // 0.1 tocca per terra per qualche Motivo
    Bot.entity.position = Pos.offset(0.5, 0.15, 0.5)
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
        logger.setLevel("debug")
        logger.color('green').log(Point + ", Is AIR!")
        return true
    }
    logger.setLevel("debug")
    logger.color('green').log(Point + ", Is not AIR!")
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
        logger.setLevel('debug')
        logger.color('green').log(Point + " It's in range")
        return true
    }
    logger.setLevel("debug")
    logger.color('red').log(Point + " It isn't in range")
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