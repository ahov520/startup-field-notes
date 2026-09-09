# DESIGN.md — Loot Drop 仿制（Open Design 姿势）

参考：https://www.loot-drop.io/（创业坟场 / Rebuild Plans）
目标产品：大学生创业田野笔记 · 手机优先知识库

## Aesthetic
Neo-brutalist graveyard database:
- Hard black borders (`3px solid #000`)
- Offset shadows (`4px 4px 0 #000`), hover shrinks shadow
- Radius **0** (sharp)
- Hero: mustard yellow `#FFD600`
- Page bg: `#FAFAFA`
- Accent orange `#FF6B00`, green `#00C853`, pink `#FF4081`
- Ink: `#0A0A0A`

## Type
- UI: "Space Grotesk" (+ Noto Sans SC for CJK)
- Meta/mono: "Space Mono"

## Components to mirror
1. Yellow hero with huge title + pipeline steps
2. Giant search box (white, 3px border, hard shadow)
3. Sort pills: 最新 / 烧钱 / 关停 / 数据
4. KPI strip (results / burned note / lifespan / top cause)
5. Card tombstones with left color bar
6. Sidebar-ish filters on desktop; bottom pills on mobile

## Do not
- Soft dark editorial glassmorphism from v21
- Rounded 999px everywhere as primary chrome
- Purple AI gradients
