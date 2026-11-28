import { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import { Utility } from "./Utility.ts";
import Settings from "./Settings.json" with { type: "json" };

export class Pathfinder {
	private Bot: Bot;
	private airBlocksIDs: number[];
	private Range: number;
	constructor(Bot: Bot) {
		this.Bot = Bot;
		this.airBlocksIDs = Utility.getBlocksIDs(
			Settings.airBlocksNames,
			Bot.version,
		);
		this.Range = Settings.pathfindingRange;
	}

	private isValidPos(Point: Vec3) {
		const Block = this.Bot.blockAt(Point);
		if (Block != null) {
			return this.airBlocksIDs.includes(Block.type);
		}
		return false;
	}

	private isInRange(Point: Vec3) {
		const Position = this.Bot.entity.position.floored();
		const plusPos = Position.offset(this.Range, this.Range, this.Range);
		const minusPos = Position.offset(-this.Range, -this.Range, -this.Range);
		return (
			Point.x <= plusPos.x &&
			Point.y <= plusPos.y &&
			Point.z <= plusPos.z &&
			Point.x >= minusPos.x &&
			Point.y >= minusPos.y &&
			Point.z >= minusPos.z
		);
	}

	private getPath(Point: Vec3) {
		const Positions = [
			new Vec3(1, 0, 0),
			new Vec3(-1, 0, 0),
			new Vec3(0, 1, 0),
			new Vec3(0, -1, 0),
			new Vec3(0, 0, 1),
			new Vec3(0, 0, -1),
		];

		// Floored and not clone() + round() perche round lo fa per eccesso e floored() restituisce subito un'istanza
		let botPosition = this.Bot.entity.position.floored();

		let Queue: Array<queueItem> = [];
		let Explored = new Set();
		Queue.push(new queueItem(botPosition, undefined));

		for (let Item of Queue) {
			if (Item.Position.equals(Point)) {
				const Coords = [];
				let Current = Item;
				while (Current.Parent != undefined) {
					Coords.push(Current.Position);
					Current = Current.Parent;
				}
				return Coords.reverse();
			}

			for (const Position of Positions) {
				let nearBlockPos = Item.Position.plus(Position);
				if (
					!Explored.has(nearBlockPos.toString()) &&
					this.isValidPos(nearBlockPos) &&
					this.isInRange(nearBlockPos)
				) {
					Explored.add(nearBlockPos.toString());
					Queue.push(new queueItem(nearBlockPos, Item));
				}
			}
		}
		return undefined;
	}

	async goTo(Point: Vec3) {
		const Path = this.getPath(Point);
		if (Path === undefined) {
			Utility.logError("There is no Path");
			return;
		}
		for (let Position of Path) {
			this.Bot.entity.position.add(Position);
			await Utility.Wait(Settings.flyDelay);
		}
	}
}

class queueItem {
	Position;
	Parent;
	constructor(Position: Vec3, Parent: queueItem | undefined) {
		this.Position = Position;
		this.Parent = Parent;
	}
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
