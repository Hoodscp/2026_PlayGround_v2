export const SECTION_COPY = {
  Play: "규칙을 잠시 내려놓고, 형태와 움직임을 자유롭게 실험하는 공간입니다.",
  Ideas: "작은 질문에서 시작된 생각들을 모으고 서로 연결해 봅니다.",
  Motion: "속도, 리듬, 탄성으로 화면에 살아 있는 반응을 만들어 냅니다.",
  Type: "글자를 정보가 아닌 하나의 조형 재료처럼 다루는 실험실입니다.",
  Color: "색의 충돌과 혼합을 통해 예상 밖의 분위기와 감각을 탐색합니다.",
  About: "PlayGround v2는 웹의 시각 언어를 가볍게 시험하는 작은 연구 공간입니다.",
} as const;

export type SectionName = keyof typeof SECTION_COPY;
export const SECTIONS = Object.keys(SECTION_COPY) as SectionName[];
