const aliases = {
  수루시: '골드 쉽 (수영복)',
  힐라스: '그래스 원더 (힐러)',
  나리브: '나리타 브라이언',
  다스카: '다이와 스칼렛',
  쌀: '라이스 샤워',
  할라이스: '라이스 샤워 (할로윈)',
  마르젠스키: '마루젠스키',
  수루젠: '마루젠스키 (수영복)',
  뭉: '마치카네 탄호이저',
  빙닭: '메지로 맥퀸 (애니메이션)',
  물닭: '메지로 맥퀸 (수영복)',
  수맥: '메지로 맥퀸 (수영복)',
  농부: '메지로 파머',
  초코봉: '미호노 부르봉 (발렌타인)',
  클비와: '비와 하야히데 (크리스마스)',
  박신: '사쿠라 바쿠신 오',
  박신오: '사쿠라 바쿠신 오',
  마망: '슈퍼 크릭',
  할크릭: '슈퍼 크릭 (할로윈)',
  수스페: '스페셜 위크 (수영복)',
  총스페: '스페셜 위크 (총대장)',
  황제: '심볼리 루돌프',
  회장: '심볼리 루돌프',
  한조: '심볼리 루돌프 (축제)',
  데지땅: '아그네스 디지털',
  아야베: '어드마이어 베가',
  동탄맘: '에어 그루브',
  웨딩맘: '에어 그루브 (웨딩)',
  몽크엘: '엘 콘도르 파사 (몽크)',
  클구리: '오구리 캡 (크리스마스)',
  킹: '킹 헤일로',
  치어킹: '킹 헤일로 (치어리더)',
  불닭: '토카이 테이오 (애니메이션)',
  하루텐: '천황상 (봄)',
  아키텐: '천황상 (가을)',
  텐노상: '천황상',
};

/**
 * Converts aliases in the text passed.
 * @param text text that might contain an alias listed above
 * @returns text with aliases converted
 */
function convertAliases(text: string) {
  const filter = new RegExp(`(${Object.keys(aliases).join('|')})`, 'g');
  const output = text.replace(
    filter,
    (match) => aliases[match as keyof typeof aliases],
  );

  return output;
}

export { convertAliases };
