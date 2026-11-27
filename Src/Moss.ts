import { createBot } from "mineflayer";
import { Pathfinder } from "./Pathfinder.ts";
import { logError } from "./Utility.ts";
import Settings from "./Settings.json" with { type: "json" };

// Creata perchè typescript fa le rogne e Auth non puo essere una string generica
function getAuth() {
	if (Settings.Auth === "offline" || Settings.Auth === "microsoft") {
		return Settings.Auth;
	} else {
		logError(
			'No default Auth config found using default Offline, Quick fix change the Settings.json Auth should be "offline" or "microsoft"',
		);
	}
}

const Bot = createBot({
	host: Settings.botServer,
	port: Settings.botPort,
	username: Settings.botName,
	version: Settings.botVersion,
	auth: getAuth(),
});

const Pf = new Pathfinder(Bot);

Pf.goTo(Bot.entity.position.offset(10, 3, 10));
