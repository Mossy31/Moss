const Mineflayer = require('mineflayer')
const Pathfinder = require('mineflayer-pathfinder').pathfinder
const Vec3 = require('vec3').Vec3

const Bot = Mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: '26.1'
})

Bot.loadPlugin(Pathfinder)

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
    'cave_vines_plant'
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
    const Positions = [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1)
    ]
    const Blocks = []

    for (Pos of Positions) {
        Blocks.push(Bot.blockAt(Position.plus(Pos)))
    }

    return Blocks
}

async function Break() {
    await Bot.waitForChunksToLoad()

    // List of Blocks IDs that can be transformed in Moss / And other useful Blocks IDs
    const mossyBlocksIDs = getIDs(mossyBlocksNames)
    const airBlocksIDs = getIDs(airBlocksNames)
    const mossBlockID = Bot.registry.blocksByName['moss_block'].id
    const Location = Bot.entity.position
    const Range = 4
    const toConvet = []

    for (let X = Location.x - Range; X < Location.x + Range; X++) {
        for (let Y = Location.y - Range; Y < Location.y + Range; Y++) {
            for (let Z = Location.z - Range; Z < Location.z + Range; Z++) {
                const Block = Bot.blockAt(new Vec3(X, Y, Z))
                const blockUp = Bot.blockAt(new Vec3(X, Y + 1, Z))
                const Perimeter = getPerimeter(Block)
                if (mossyBlocksIDs.includes(Block.type)) {
                    if (airBlocksIDs.includes(blockUp.type)) {
                        for (const pBlock of Perimeter) {
                            if (pBlock.id == mossBlockID) {
                                const mossBlockUp = Bot.blockAt(pBlock.position.offset(0, 1, 0))
                                if (airBlocksIDs.includes(mossBlockUp.type)) {
                                    toConvet.push(pBlock)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(toConvet)
}

Bot.once('spawn', Break)

// let Blocks = Bot.findBlocks({
//     matching: mossyBlocksIDs,
//     maxDistance: 4,
//     useExtraInfo: (Block) => {
//         if (getIDs(['air', 'cave_air', 'void_air']).includes(Bot.blockAt(Block.position.offset(0, 1, 0)).type)) {
//             console.log(Block.position)
//             const Perimeter = getPerimeter(Block)
//             if (Perimeter.includes(mossID))
//                 return true
//         }
//         return false
//     },
//     count: 128,
//     point: Bot.entity.position
// })