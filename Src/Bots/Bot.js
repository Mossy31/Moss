// import { mineflayer as mineflayerViewer } from 'prismarine-viewer'
import mineflayer from 'mineflayer'
import { Vec3 } from 'vec3'
// usare sempre il './' senza cerchera un pachetto installato in 'node_modules'
import  { Wait, getBlocksIDs, getItemsIDs, loadMossTable } from '../Functions/Utility.ts'
//Creates the logger to set specific colors
import logger from 'node-color-log'



// All delays are in milliseconds

const Version = 26.1

const flyDelay = 150

const Range = 16
const fillPercent = 87.5 / 100
const elytraMinDurabilityPercent = 12.5 / 100

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
    'pale_moss_block'
]

// List of Blocks IDs that can be transformed in Moss / And other Blocks IDs
const mossyBlocksIDs = getBlocksIDs(mossyBlocksNames, Bot.version)
const airBlocksIDs = getBlocksIDs(airBlocksNames, Bot.version)
const mossBlockID = getBlocksIDs('moss_block', Bot.version)

//--------------------//

const Bot = mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: Version
})

Bot.on('chat', Fly)
Bot.on('chat', Test)

Bot.on('kicked', (Res) => {
    logger.color('red').bold().italic().log("Bot kicked" + Res)
})

Bot.on('error', (Error) => {
    logger.color('red').bold().italic().log("Bot error: " + Error)
})

Bot._client.on('error', (Error) => {
    logger.color('red').bold().italic().log("Client error: " +Error)
})

/*
    Bot._client.on('packet', (Data, Meta, Buffer) => {
        logger.color('red').bold().log("Data: " + Data)
        logger.color('yellow').bold().log("Meta: " + Meta.name + " " + Meta.state)
    })
*/

//--------------------//

function getPerimeter(Block) {
    const Position = Block.position
    let Blocks = 0
    // Ogni blocco che lo circonda e che probabilita a di diventare a sua volta un blocco di Muschio
    // Tabella presa dalla Mc wiki
    const Positions = loadMossTable()

    // TODO: Optimize
    for (let Pos of Positions) {
        // Some test i made for the positions to get how down and how up can the moss expand :P
        let Yep = false
        let Det = Block.position.plus(Pos.Coords.offset(0, 1, 0))
        if (airBlocksIDs.includes(Bot.blockAt(Det).type)) {
            // θ is the variable for no reason!
            for (let θ = 1; θ <= 6; θ++) {
                let Current = Det.plus(new Vec3(0, -θ, 0))
                let B = Bot.blockAt(Current).type
                if (mossyBlocksIDs.includes(B)) {
                    Yep = true
                }
            }
        } else {
            for (let θ = 1; θ <= 5; θ++) {
                //Can't reassin
                let Current = Det.plus(new Vec3(0, θ, 0))
                let B = Bot.blockAt(Current).type
                if (airBlocksIDs.includes(B)) {
                    if (mossyBlocksIDs.includes(Bot.blockAt(Current.offset(0, -1, 0)).type)) {
                        Yep = true
                    }
                    break
                }
            }
        }
        if (Yep) {
            Blocks += Pos.Number
        }
    }
    return Blocks
}

function getItems(Name) {
    const Inv = Bot.inventory.slots
    const Slots = []
    if (Inv != null) {
        for (let Slot of Inv) {
            if (Slot != null) {
                if (Slot.type == getItemsIDs(Name, Bot.version)) {
                    Slots.push(Slot)
                }
            }
        }
        return Slots
    }
    return null
}

function distanceTo(Point) {
    return Bot.entity.position.distanceTo(Point)
}

// Exp function!
/*
    export async function Exp() {
        const Bottles = getItems('experience_bottle')
        if (Bottles.length > 0) {
            logger.color('green').log('Exp found!')
            Bottles.sort((A, B) => {
                logger.log(A.count, B.count)
                return B.count - A.count
            })
            await Bot.look(0, Math.PI / 2)
            logger.color('green').bold().append('List of items: ').reset().color('green').append(Bottles).log()
            await Bot.equip(Bottles[0], 'hand')
            if(Bottles.count >= expBatchSize) {
                for(let Index = 0; Index < expBatchSize; Index++) {
                    Bot.activateItem()
                    Wait(expTrowSpeed)
                }
            }    
        } else {
            return false
        }
    }
*/

// Reafctor the Times count with the real Moss spread Mecanic
async function Search() {
    await Bot.waitForChunksToLoad()

    const Location = Bot.entity.position.floored()

    let toBonemeal = []
    for (let X = Location.x; X < Location.x + Range; X++) {
        for (let Y = Location.y -1; Y < Location.y + Range - 1; Y++) {
            for (let Z = Location.z; Z < Location.z + Range; Z++) {
                const Block = Bot.blockAt(new Vec3(X, Y, Z))
                if (Block.type == mossBlockID) {
                    const blockUp = Bot.blockAt(new Vec3(X, Y + 1, Z))
                    if (airBlocksIDs.includes(blockUp.type)) {
                        toBonemeal.push({ "Block": Block, "Times": getPerimeter(Block) })
                    }
                }
            }
        }
    }
    if (toBonemeal.length > 0) {
        toBonemeal.sort((A, B) => {
            let PosA = A.Block.position
            let PosB = B.Block.position
            let distA = distanceTo(PosA)
            let distB = distanceTo(PosB)
            if (distA == 0 && distB == 0) {
                return 0
            }
            // Perche deve restituire un numero negativo se A < B e positivo se A > B
            return A.Times / distA - B.Times / distB

        })
        toBonemeal.reverse()
        return toBonemeal[0]
    }
    return undefined
}

// Mario vola nessuno sa come Lol :)

async function Fly(User, Msg) {
    if (User == 'elonMuschio' && Msg == 'Fly') {
        let Moss
        for(let Index = 0; Index < 16; Index++) {
            Moss = await Search()
            if (Moss != undefined) {
                await flyElytra()
                await elytraTo(Moss.Block.position.offset(0, 1, 0))
                Bot.physicsEnabled = true
                await Wait(2)
                await Bonemeal(Moss.Block)
            }
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
    await Bot.lookAt(Block.position, true)
    Bot.activateBlock(Block)
}

// Jump and opens the Elytra
async function flyElytra() {
    if (!Bot.entity.elytraFlying) {
        Bot.physicsEnabled = true
        await Bot.look(0, 0, true)
        await equipElytra()
        await Jump()
        fallFlying()
        await Wait(1)
        Bot.physicsEnabled = false
    }
}


// Cerca una alyrta con durabilita accetabile ho rotta ma riparabile con mending prova a ripararla in caso non riesce passa avanti
async function equipElytra() {
    const elytras = getItems('elytra')
    if (elytras.length > 0) {
        elytras.sort((A, B) => {
            return A.durabilityUsed - B.durabilityUsed
        })
        for (let elytra of elytras) {
            if (elytra.maxDurability - elytra.durabilityUsed <= elytra.maxDurability * elytraMinDurabilityPercent) {
                let Enchants = elytra.enchants.enchantments
                logger.log(Enchants)
                //23 Mendign ID
                //Some controlla se c'è almeno un elemento che rispetta la condizione
                if (Enchants !== undefined && Enchants.some((Value) => { return Value.id == 23 && Value.level == 1 })) {
                    let S = true
                    logger.color('yellow').bold().log('Elytra has Mending')
                } else {
                    logger.color('red').bold().log('Broken elytra does not have Mending')
                }
            } else {
                logger.color('green').bold().log('Elytra is Fine')
                await Bot.equip(elytra, 'torso')
                break
            }
        }
    } else {
        logger.color('red').bold().log('No elytra in the Inv')
        return
    }
}

async function Jump() {
    Bot.setControlState('jump', true)
    await Wait(1)
    Bot.setControlState('jump', false)
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
            await Wait(flyDelay)
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
    // Set e non array perchè piu efficiente a confrontare se un elemento c'è gia
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
        }
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
    await Wait(flyDelay)
}


async function elytraTo(Point) {
    const Path = await getPath(Point, 16)
    await executePath(Path)
}

function isValidPos(Point) {
    const Block = Bot.blockAt(Point)
    return airBlocksIDs.includes(Block.type)

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