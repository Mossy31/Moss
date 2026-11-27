import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import Settings from "../Settings/Settings.json"
import { getBlocksIDs } from "../Functions/Utility.ts";

class Pathfinder {
  Bot: Bot;
  constructor(Bot: Bot) {
    this.Bot = Bot;
  }

  isValidPos(Point: Vec3) {
    const Block = this.Bot.blockAt(Point);
    return getBlocksIDs(Settings.airBlocksNames, this.Bot.version).includes();
  }

  isInRange(Pos: Vec3, Point: Vec3) {
    const Range = 16;
    const plusPos = Pos.offset(Range, Range, Range);
    const minusPos = Pos.offset(-Range, -Range, -Range);
    let rangeX = Point.x >= minusPos.x && Point.x <= plusPos.x;
    let rangeY = Point.y >= minusPos.y && Point.y <= plusPos.y;
    let rangeZ = Point.z >= minusPos.z && Point.z <= plusPos.z;
    return rangeX && rangeY && rangeZ;
  }
  getPath(Point: Vec3, Bot: Bot) {
    // List of relative positions around a Block
    const Positions = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 1, 0),
      new Vec3(0, -1, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1),
    ];
    const Pos = Bot.entity.position;
    const First = {
      // Floored and not clone() + round() perche round lo fa per eccesso
      Position: Pos.floored(),
      Parent: undefined,
    };
    // Lista di blocchi da esplorare
    let Queue = [];
    // Set e non array perchè piu efficiente a confrontare se un elemento c'è gia
    let Explored = new Set();
    Queue.push(First);

    for (let Item of Queue) {
      if (Item.Position.equals(Point)) {
        const Coords = [];
        let Current = Item;
        while (Current != undefined) {
          Coords.push(Current.Position);
          //Current = Current.Parent
        }
        return Coords;
      }
      for (const Position of Positions) {
        let nearBlockPos = Item.Position.plus(Position).round();
        if (
          /*isInRange(Pos, nearBlockPos)*/ true &&
          !Explored.has(nearBlockPos.toString()) &&
          isValidPos(nearBlockPos, Bot)
        ) {
          Explored.add(nearBlockPos.toString());
          Queue.push({
            Position: nearBlockPos,
            Parent: Item,
          });
        }
      }
    }
    return undefined;
  }
}
