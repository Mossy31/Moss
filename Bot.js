const Mineflayer = require('mineflayer')
const Vec3 = require('vec3').Vec3

const Bot = Mineflayer.createBot({
    host: 'localhost',
    port: 25565,
    username: 'Mario',
    version: '1.21.11'
})

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
    const Positions = [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1)
    ]
    const Blocks = []

    for (const Pos of Positions) {
        Blocks.push(Bot.blockAt(Position.plus(Pos)))
    }

    return Blocks
}

async function Run() {
    await Bot.waitForChunksToLoad()

    // List of Blocks IDs that can be transformed in Moss / And other useful Blocks IDs
    const mossyBlocksIDs = getIDs(mossyBlocksNames)
    const airBlocksIDs = getIDs(airBlocksNames)
    const mossBlockID = Bot.registry.blocksByName['moss_block'].id
    const Location = Bot.entity.position
    const Range = 16
    const toConvert = []

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
                                    if (!toConvert.some((Block) => {
                                        if (perimeterBlock.position.equals(Block.position)) {
                                            return true
                                        }
                                        return false
                                    })) {
                                        toConvert.push(perimeterBlock)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(toConvert.length)
}

Bot.once('spawn', Run)