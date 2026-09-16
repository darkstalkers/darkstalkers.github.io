export const CABINETS = ['1', '2', '3', '4'] as const;
export type Cabinet = typeof CABINETS[number];

export interface CabinetSide {
  teamKey: string | null;
  currentIndex: number | null; // 対戦中のメンバー（team.members内のインデックス）
  eliminated: number[];        // 既に負けたメンバーのインデックス一覧
}

export interface CabinetState {
  p1: CabinetSide;
  p2: CabinetSide;
}

export const BLANK_SIDE = (): CabinetSide => ({
  teamKey: null,
  currentIndex: null,
  eliminated: [],
});

export const BLANK_CABINET = (): CabinetState => ({
  p1: BLANK_SIDE(),
  p2: BLANK_SIDE(),
});
