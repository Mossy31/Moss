import minecraftData from "minecraft-data";
import { Vec3 } from "vec3";

import Settings from "../Settings/Settings.json" with { type: "json" };

// Just a delay that works with no Physics (Palle)
export async function Wait(Time: number) {
  if (Time >= 0) {
    // Crea una promise che si risolvera con il metodo resolve che è chiamato dopo X Ticks le funzioni Async ritornano sempre una Promise
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(0);
      }, Time);
    });
  }
}

export function getBlocksIDs(
  Names: Array<string> | string,
  Version: string | number,
) {
  const Data = minecraftData(Version);
  if (typeof Names === "string") {
    return Data.blocksByName[Names].id;
  }
  let blocksIDs: Array<number> = [];
  for (const Name of Names) {
    blocksIDs.push(Data.blocksByName[Name].id);
  }
  return blocksIDs;
}

export function getItemsIDs(
  Names: Array<string> | string,
  Version: string | number,
) {
  const Data = minecraftData(Version);
  if (typeof Names === "string") {
    return Data.itemsByName[Names].id;
  }
  let itemsIDs: Array<number> = [];
  for (const Name of Names) {
    itemsIDs.push(Data.itemsByName[Name].id);
  }
  return itemsIDs;
}

// Carica la tabella Excel e la converte in un ogetto JavaScript
// Ogni blocco che lo circonda e che probabilita a di diventare a sua volta un blocco di Muschio
// Tabella presa dalla Mc wiki
export function loadMossStat() {
  return [
    { Number: 0, Coords: new Vec3(3, 0, 3) },
    { Number: 0.1875, Coords: new Vec3(2, 0, 3) },
    { Number: 0.375, Coords: new Vec3(1, 0, 3) },
    { Number: 0.375, Coords: new Vec3(0, 0, 3) },
    { Number: 0.375, Coords: new Vec3(-1, 0, 3) },
    { Number: 0.1875, Coords: new Vec3(-2, 0, 3) },
    { Number: 0, Coords: new Vec3(-3, 0, 3) },

    { Number: 0.1875, Coords: new Vec3(3, 0, 2) },
    { Number: 0.625, Coords: new Vec3(2, 0, 2) },
    { Number: 0.875, Coords: new Vec3(1, 0, 2) },
    { Number: 0.875, Coords: new Vec3(0, 0, 2) },
    { Number: 0.875, Coords: new Vec3(-1, 0, 2) },
    { Number: 0.625, Coords: new Vec3(-2, 0, 2) },
    { Number: 0.1875, Coords: new Vec3(-3, 0, 2) },

    { Number: 0.375, Coords: new Vec3(3, 0, 1) },
    { Number: 0.875, Coords: new Vec3(2, 0, 1) },
    { Number: 1, Coords: new Vec3(1, 0, 1) },
    { Number: 1, Coords: new Vec3(0, 0, 1) },
    { Number: 1, Coords: new Vec3(-1, 0, 1) },
    { Number: 0.875, Coords: new Vec3(-2, 0, 1) },
    { Number: 0.375, Coords: new Vec3(-3, 0, 1) },

    { Number: 0.375, Coords: new Vec3(3, 0, 0) },
    { Number: 0.875, Coords: new Vec3(2, 0, 0) },
    { Number: 1, Coords: new Vec3(1, 0, 0) },
    // Ignore Center { Number: 1, Coords: new Vec3(0, 0, 0) },
    { Number: 1, Coords: new Vec3(-1, 0, 0) },
    { Number: 0.875, Coords: new Vec3(-2, 0, 0) },
    { Number: 0.375, Coords: new Vec3(-3, 0, 0) },

    { Number: 0.375, Coords: new Vec3(3, 0, -1) },
    { Number: 0.875, Coords: new Vec3(2, 0, -1) },
    { Number: 1, Coords: new Vec3(1, 0, -1) },
    { Number: 1, Coords: new Vec3(0, 0, -1) },
    { Number: 1, Coords: new Vec3(-1, 0, -1) },
    { Number: 0.875, Coords: new Vec3(-2, 0, -1) },
    { Number: 0.375, Coords: new Vec3(-3, 0, -1) },

    { Number: 0.1875, Coords: new Vec3(3, 0, -2) },
    { Number: 0.625, Coords: new Vec3(2, 0, -2) },
    { Number: 0.875, Coords: new Vec3(1, 0, -2) },
    { Number: 0.875, Coords: new Vec3(0, 0, -2) },
    { Number: 0.875, Coords: new Vec3(-1, 0, -2) },
    { Number: 0.625, Coords: new Vec3(-2, 0, -2) },
    { Number: 0.1875, Coords: new Vec3(-3, 0, -2) },

    { Number: 0, Coords: new Vec3(3, 0, -3) },
    { Number: 0.1875, Coords: new Vec3(2, 0, -3) },
    { Number: 0.375, Coords: new Vec3(1, 0, -3) },
    { Number: 0.375, Coords: new Vec3(0, 0, -3) },
    { Number: 0.375, Coords: new Vec3(-1, 0, -3) },
    { Number: 0.1875, Coords: new Vec3(-2, 0, -3) },
    { Number: 0, Coords: new Vec3(-3, 0, -3) },
  ];
}
