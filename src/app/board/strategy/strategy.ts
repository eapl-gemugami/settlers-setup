import { Board, BoardSpec, ResourceType, Coordinate } from '../board';
import { RandomQueue } from '../random-queue';

export enum DesertPlacement {
  RANDOM = 'Random',
  CENTER = 'Center',
  OFF_CENTER = 'Off Center',
  INLAND = 'Inland',
  COAST = 'Coast',
}

export enum ResourceDistribution {
  EVEN = 'Even',
  CLUMPED = 'Clumped',
}

export enum Tiles {
  A,
  B,
  C,
  D,
  E,
  F,
}

export interface StrategyOptions {
  desertPlacement: DesertPlacement;
  // 0 - similar resource types are clumped together.
  // 0.5 - random
  // 1 - resources are evenly distrubted.
  resourceDistribution: number;
  // 0 - good numbers are grouped together
  // 1 - each board corner is as close in value to others as possible
  numberDistribution: number;
  shufflePorts: boolean;
  portsInFrame: boolean;
  // Allow a resource hex to be placed next to a port of the same type.
  allowResourceOnPort: boolean;
}

type Segment = Record<string, [Coordinate, Coordinate]>;
type Segments = Record<number, Segment>;

/**
 * A strategy for creating a catan board.
 */
export interface Strategy {
  readonly name: string;
  generateBoard: (spec: BoardSpec) => { board: Board, score: number };
}

export type StrategyConstructor = new (options: StrategyOptions) => Strategy;

export function shufflePortPositions(board: Board) {
  const resources = new RandomQueue<ResourceType>();
  for (const port of board.ports) {
    resources.push(port.resource);
  }

  for (const port of board.ports) {
    port.resource = resources.pop()!;
  }
}

export function createShuffledFrame(board: Board) {
  // For 5-6 players
  const segments: Segments = {
    1: {
      'A': [{ x: 3, y: 0 }, { x: 4, y: 0 }],
      'B': [{ x: 4, y: 0 }, { x: 5, y: 0 }],
      'C': [{ x: 5, y: 0 }, { x: 6, y: 0 }],
      'D': [{ x: 6, y: 0 }, { x: 7, y: 0 }],
      'E': [{ x: 6, y: 0 }, { x: 7, y: 0 }],
    },
    2: {
      'A': [{ x: 8, y: 0 }, { x: 9, y: 0 }],
      'B': [{ x: 9, y: 0 }, { x: 9, y: 1 }],
      'C': [{ x: 9, y: 1 }, { x: 10, y: 1 }],
      'D': [{ x: 10, y: 1 }, { x: 10, y: 2 }],
      'E': [{ x: 10, y: 2 }, { x: 11, y: 2 }],
    },
    3: {
      'A': [{ x: 12, y: 3 }, { x: 12, y: 4 }],
      'B': [{ x: 12, y: 4 }, { x: 11, y: 4 }],
      'C': [{ x: 11, y: 4 }, { x: 11, y: 5 }],
      'D': [{ x: 11, y: 5 }, { x: 10, y: 5 }],
      'E': [{ x: 10, y: 5 }, { x: 10, y: 6 }],
    },
    4: {
      'A': [{ x: 9, y: 7 }, { x: 8, y: 7 }],
      'B': [{ x: 8, y: 7 }, { x: 7, y: 7 }],
      'C': [{ x: 7, y: 7 }, { x: 6, y: 7 }],
      'D': [{ x: 6, y: 7 }, { x: 5, y: 7 }],
      'E': [{ x: 5, y: 7 }, { x: 4, y: 7 }],
    }
  }

  const frameTiles: Array<Array<{ segment: keyof Segment; resource: ResourceType }>> = [
    [ // Tile 1
      {
        segment: 'C',
        resource: ResourceType.ANY,
      },
    ],
    [ // Tile 2
      {
        segment: 'A',
        resource: ResourceType.ANY,
      },
      {
        segment: 'D',
        resource: ResourceType.SHEEP,
      },
    ],
    [ // Tile 3
      {
        segment: 'C',
        resource: ResourceType.ORE,
      },
    ],
    [ // Tile 4
      {
        segment: 'A',
        resource: ResourceType.ANY,
      },
      {
        segment: 'D',
        resource: ResourceType.WHEAT,
      },
    ],
  ]

  // Put all the tiles in the RandomQueue
  const tiles = new RandomQueue<typeof frameTiles[0]>();
  frameTiles.forEach(tile => tiles.push(tile));

  // Clear ports array to start over
  board.ports = [];

  let currentSegment = 1;

  for (const tile of frameTiles) {
    let currentTile = tiles.pop()!;

    for (const { segment, resource } of currentTile) {
      board.ports.push({
        resource,
        corners: segments[currentSegment][segment],
      });
    }

    currentSegment += 1;
  }

  // Add the static Sheep and 3-1
  board.ports.push({
    resource: ResourceType.SHEEP,
    corners: [{ x: 9, y: 6 }, { x: 9, y: 7 }],
  });

  board.ports.push({
    resource: ResourceType.ANY,
    corners: [{x: 1, y: 4}, {x: 0, y: 4}],
  });
}
