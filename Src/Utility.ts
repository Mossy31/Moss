import minecraftData, { IndexedData } from "minecraft-data";
import logger from "node-color-log";

export class Utility {
	static getBlocksIDs(Blocks: string[], Version: string | number) {
		const Data: IndexedData = minecraftData(Version);
		let blocksIDs: Array<number> = [];
		for (const Name of Blocks) {
			blocksIDs.push(Data.blocksByName[Name].id);
		}
		return blocksIDs;
	}

	static logError(Msg: string) {
		logger
			.color("red")
			.bold()
			.log("[Error] " + Msg);
	}

	static Wait(Millis: number) {
		return new Promise((Resolve) => {
			setTimeout(Resolve, Millis);
		});
	}
}
