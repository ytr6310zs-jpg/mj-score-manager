export type YakumanDef = {
  code: string;
  name: string;
  points: number | null;
};

// リファレンスとしての代表的な役満定義。必要に応じて拡張してください。
export const YAKUMANS: YakumanDef[] = [
  { code: "DA", name: "大三元", points: 32000 },
  { code: "DS", name: "大四喜", points: 32000 },
  { code: "TS", name: "天和", points: 32000 },
  { code: "CH", name: "地和", points: 32000 },
  { code: "KY", name: "国士無双", points: 32000 },
  { code: "SS", name: "四暗刻", points: 32000 },
  { code: "ZN", name: "純正九蓮宝燈", points: 32000 },
  { code: "HN", name: "混一色大三元(例)", points: 32000 },
];

export default YAKUMANS;
