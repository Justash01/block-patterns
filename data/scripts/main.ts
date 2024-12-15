import { world } from "@minecraft/server";
import { Vector3, BlockMatcher } from './utils';

world.afterEvents.playerPlaceBlock.subscribe(eventData => {
  const { block: b, dimension } = eventData;

  if (b.typeId === "minecraft:diamond_block") {
    const tPosePattern = {
      triggerBlock: {
        blockType: "minecraft:diamond_block",
        location: new Vector3(b.location.x, b.location.y, b.location.z)
      },
      pattern: [
        { offset: [0, -1, 0] as [number, number, number], blockType: "minecraft:iron_block" },
        { offset: [0, -2, 0] as [number, number, number], blockType: "minecraft:iron_block" },
        { offset: [0, -1, 1] as [number, number, number], blockType: "minecraft:iron_block" },
        { offset: [0, -1, -1] as [number, number, number], blockType: "minecraft:iron_block" }
      ]
    };

    const blockMatcher = new BlockMatcher(dimension);
    const tPose = blockMatcher.matchBlocks(tPosePattern, { destroyBlocks: true });

    if (tPose.matched) {
      const center = tPose.center as Vector3;
      dimension.spawnEntity("minecraft:cow", center);
    } else {
      console.warn("Pattern not matched");
    }
  }
});